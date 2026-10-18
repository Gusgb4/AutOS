import { CategoriaDespesa, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import {
  FUSO,
  UM_DIA_MS,
  descreverPeriodo,
  mesBrasilia,
  parsePeriodo,
  periodoAnterior,
  variacao,
  type Periodo as PeriodoDatas,
} from "../utils/periodo";

export type TipoLancamento = "RECEITA" | "DESPESA";

interface Periodo {
  // "2026-10-01" a "2026-10-31" (fim inclusivo), no fuso de Brasília
  inicio?: string;
  fim?: string;
}

interface Filtros extends Periodo {
  tipo?: TipoLancamento;
  categoria?: CategoriaDespesa;
  estornados?: boolean;
}

function filtroPeriodo({ inicio, fim }: Periodo) {
  if (!inicio && !fim) return undefined;
  return {
    gte: inicio ? new Date(`${inicio}T00:00:00${FUSO}`) : undefined,
    lt: fim
      ? new Date(new Date(`${fim}T00:00:00${FUSO}`).getTime() + UM_DIA_MS)
      : undefined,
  };
}

export async function listEntries(filtros: Filtros) {
  const onde: Prisma.FinancialEntryWhereInput = {
    // Por padrão só os ativos; com estornados=true vêm os dois
    estornado: filtros.estornados ? undefined : false,
    tipo: filtros.tipo,
    categoria: filtros.categoria,
    data: filtroPeriodo(filtros),
  };

  return prisma.financialEntry.findMany({
    where: onde,
    include: {
      ordemServico: { select: { id: true, status: true, valor_total: true } },
    },
    orderBy: { data: "desc" },
  });
}

// Despesas ativas do período agrupadas por categoria, da maior para a menor
export async function despesasPorCategoria(periodo: Periodo) {
  const grupos = await prisma.financialEntry.groupBy({
    by: ["categoria"],
    where: { tipo: "DESPESA", estornado: false, data: filtroPeriodo(periodo) },
    _sum: { valor: true },
  });

  const total = grupos.reduce(
    (acc, g) => acc.plus(g._sum.valor ?? 0),
    new Prisma.Decimal(0),
  );

  const categorias = grupos
    .map((g) => {
      const valor = g._sum.valor ?? new Prisma.Decimal(0);
      return {
        categoria: g.categoria ?? "OUTROS",
        valor: valor.toDecimalPlaces(2).toNumber(),
        percentual: total.isZero()
          ? 0
          : valor.div(total).mul(100).toDecimalPlaces(1).toNumber(),
      };
    })
    .sort((a, b) => b.valor - a.valor);

  return { total: total.toDecimalPlaces(2).toNumber(), categorias };
}

async function totaisDoPeriodo(p: PeriodoDatas) {
  const grupos = await prisma.financialEntry.groupBy({
    by: ["tipo"],
    where: { estornado: false, data: { gte: p.inicio, lt: p.fimExclusivo } },
    _sum: { valor: true },
  });

  const soma = (tipo: TipoLancamento) =>
    grupos.find((g) => g.tipo === tipo)?._sum?.valor ?? new Prisma.Decimal(0);
  const entradas = soma("RECEITA");
  const saidas = soma("DESPESA");

  return {
    entradas: entradas.toDecimalPlaces(2).toNumber(),
    saidas: saidas.toDecimalPlaces(2).toNumber(),
    saldo: entradas.minus(saidas).toDecimalPlaces(2).toNumber(),
  };
}

// Entradas, saídas e saldo do período comparados com o anterior de mesma
// duração. Sem período: mês atual contra o mês anterior.
export async function resumoComparativo(intervalo?: {
  inicio: string;
  fim: string;
}) {
  const atual = intervalo
    ? parsePeriodo(intervalo.inicio, intervalo.fim)
    : mesBrasilia(0);
  const anterior = intervalo ? periodoAnterior(atual) : mesBrasilia(-1);

  const [totaisAtual, totaisAnterior] = await Promise.all([
    totaisDoPeriodo(atual),
    totaisDoPeriodo(anterior),
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
  };
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
      // Meio-dia de Brasília: "2026-10-18" não vira o dia anterior em UTC
      data: dados.data ? new Date(`${dados.data}T12:00:00${FUSO}`) : new Date(),
      categoria: dados.tipo === "DESPESA" ? dados.categoria : null,
      estornado: false,
    },
  });
}
