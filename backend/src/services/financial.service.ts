import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { comPagamento, pagamentosAtivos } from "./serviceOrders.service";

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
