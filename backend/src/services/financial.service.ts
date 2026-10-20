import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
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

interface Filtros {
  tipo?: string;
  inicio?: string;
  fim?: string;
}

export async function listEntries(filtros: Filtros) {
  // Garante por padrão que apenas lançamentos não estornados sejam listados
  const onde: any = {
    estornado: false,
  };

  if (filtros.tipo) onde.tipo = filtros.tipo;

  if (filtros.inicio || filtros.fim) {
    onde.data = {};
    if (filtros.inicio) onde.data.gte = new Date(filtros.inicio);
    if (filtros.fim) onde.data.lte = new Date(filtros.fim);
  }

  return prisma.financialEntry.findMany({
    where: onde,
    orderBy: { data: "desc" },
  });
}

export async function createEntry(dados: {
  tipo: string;
  descricao: string;
  valor: number;
  data?: string;
}) {
  return prisma.financialEntry.create({
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      data: dados.data ? new Date(dados.data) : new Date(),
      estornado: false,
    },
  });
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
