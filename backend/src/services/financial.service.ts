import { CategoriaDespesa, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { comPagamento, pagamentosAtivos } from "./serviceOrders.service";
import {
  Periodo,
  arredondar,
  descreverPeriodo,
  parseMes,
  parsePeriodo,
  periodoAnterior,
  variacao,
} from "./reports.service";

export type TipoLancamento = "RECEITA" | "DESPESA";

interface Filtros {
  tipo?: TipoLancamento;
  categoria?: CategoriaDespesa;
  inicio?: string; // "2026-10-01"
  fim?: string; // "2026-10-31" (inclusivo)
  estornados?: boolean;
}

// Datas no fuso de Brasília; o fim conta o dia inteiro
function filtroData(inicio?: string, fim?: string) {
  if (!inicio && !fim) return undefined;
  return {
    gte: inicio ? parsePeriodo(inicio, inicio).inicio : undefined,
    lt: fim ? parsePeriodo(fim, fim).fimExclusivo : undefined,
  };
}

export async function listEntries(filtros: Filtros) {
  return prisma.financialEntry.findMany({
    where: {
      // Por padrão só os ativos; com estornados=true vêm os dois
      estornado: filtros.estornados ? undefined : false,
      tipo: filtros.tipo,
      categoria: filtros.categoria,
      data: filtroData(filtros.inicio, filtros.fim),
    },
    orderBy: { data: "desc" },
  });
}

export async function createEntry(dados: {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  data?: string;
  categoria?: CategoriaDespesa;
}) {
  return prisma.financialEntry.create({
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      // Meio-dia de Brasília, pra data não "voltar" um dia por causa do fuso
      data: dados.data ? new Date(`${dados.data}T12:00:00-03:00`) : new Date(),
      // Categoria só faz sentido em despesa
      categoria: dados.tipo === "DESPESA" ? dados.categoria : null,
      estornado: false,
    },
  });
}

// Lançamento errado não é apagado nem editado: é estornado (fica no histórico,
// mas sai dos totais) e o certo é lançado de novo.
// Só vale pra lançamento manual. Pagamento de OS é estornado pela tela da OS,
// porque lá o estorno também recalcula o status de pagamento.
export async function estornarLancamento(id: string) {
  const lancamento = await prisma.financialEntry.findUnique({ where: { id } });

  if (!lancamento) {
    throw new AppError("Lançamento não encontrado.", 404);
  }
  if (lancamento.ordemId !== null) {
    throw new AppError(
      "Pagamento de OS é estornado na tela da própria OS.",
      409,
    );
  }

  // updateMany com estornado: false evita estornar duas vezes ao mesmo tempo
  const { count } = await prisma.financialEntry.updateMany({
    where: { id, estornado: false },
    data: { estornado: true },
  });

  if (count === 0) {
    throw new AppError("Este lançamento já foi estornado.", 409);
  }

  return prisma.financialEntry.findUniqueOrThrow({ where: { id } });
}

// Despesas ativas do período, agrupadas por categoria (da maior pra menor)
async function despesasPorCategoria(p: Periodo) {
  const grupos = await prisma.financialEntry.groupBy({
    by: ["categoria"],
    where: {
      tipo: "DESPESA",
      estornado: false,
      data: { gte: p.inicio, lt: p.fimExclusivo },
    },
    _sum: { valor: true },
  });

  const total = grupos.reduce(
    (acc, g) => acc.plus(g._sum?.valor ?? 0),
    new Prisma.Decimal(0),
  );

  return grupos
    .map((g) => {
      const valor = g._sum?.valor ?? new Prisma.Decimal(0);
      return {
        categoria: g.categoria ?? "OUTROS",
        valor: arredondar(valor),
        percentual: total.isZero()
          ? 0
          : valor.div(total).mul(100).toDecimalPlaces(1).toNumber(),
      };
    })
    .sort((a, b) => b.valor - a.valor);
}

export async function contasAReceber() {
  const ordens = await prisma.serviceOrder.findMany({
    where: { status: "FINALIZADA" },
    select: {
      id: true,
      status: true,
      valor_total: true,
      finalizada_em: true,
      cliente: { select: { id: true, nome: true } },
      financialEntries: pagamentosAtivos,
    },
    orderBy: { finalizada_em: "asc" },
  });

  const emAberto = ordens.map(comPagamento).filter((o) => o.saldo.gt(0));

  return {
    total: emAberto.reduce(
      (acc, o) => acc.plus(o.saldo),
      new Prisma.Decimal(0),
    ),
    ordens: emAberto.map((o) => ({
      id: o.id,
      cliente: o.cliente,
      valor_total: o.valor_total,
      valor_pago: o.valor_pago,
      saldo: o.saldo,
      status_pagamento: o.status_pagamento,
      finalizada_em: o.finalizada_em,
    })),
  };
}

// Entradas, saídas e saldo do período (lançamentos não estornados)
async function totaisDoPeriodo(p: Periodo) {
  const grupos = await prisma.financialEntry.groupBy({
    by: ["tipo"],
    where: { estornado: false, data: { gte: p.inicio, lt: p.fimExclusivo } },
    _sum: { valor: true },
  });

  const soma = (tipo: string) =>
    grupos.find((g) => g.tipo === tipo)?._sum.valor ?? new Prisma.Decimal(0);
  const entradas = soma("RECEITA");
  const saidas = soma("DESPESA");

  return {
    entradas: arredondar(entradas),
    saidas: arredondar(saidas),
    saldo: arredondar(entradas.minus(saidas)),
  };
}

// "2026-10" no fuso de Brasília
function mesAtual() {
  return new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString().slice(0, 7);
}

function mesAnterior(mes: string) {
  const [ano, numero] = mes.split("-").map(Number);
  return new Date(Date.UTC(ano, numero - 2, 1)).toISOString().slice(0, 7);
}

// Com período: compara com o anterior de mesma duração.
// Sem período: mês atual contra o mês anterior.
export async function resumoComparativo(inicio?: string, fim?: string) {
  let atual: Periodo;
  let anterior: Periodo;

  if (inicio && fim) {
    atual = parsePeriodo(inicio, fim);
    anterior = periodoAnterior(atual);
  } else {
    const mes = mesAtual();
    atual = parseMes(mes);
    anterior = parseMes(mesAnterior(mes));
  }

  const [totaisAtual, totaisAnterior, porCategoria] = await Promise.all([
    totaisDoPeriodo(atual),
    totaisDoPeriodo(anterior),
    despesasPorCategoria(atual),
  ]);

  return {
    periodo: descreverPeriodo(atual),
    periodo_anterior: descreverPeriodo(anterior),
    atual: totaisAtual,
    anterior: totaisAnterior,
    variacao: {
      entradas: variacao(totaisAtual.entradas, totaisAnterior.entradas),
      saidas: variacao(totaisAtual.saidas, totaisAnterior.saidas),
      saldo: variacao(totaisAtual.saldo, totaisAnterior.saldo),
    },
    despesas_por_categoria: porCategoria,
  };
}
