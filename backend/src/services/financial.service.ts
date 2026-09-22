import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

export type TipoLancamento = "RECEITA" | "DESPESA";

interface ListEntriesFilters {
  tipo?: TipoLancamento;
  inicio?: Date;
  fim?: Date;
}

export async function listEntries(filtros: ListEntriesFilters = {}) {
  const { tipo, inicio, fim } = filtros;

  return prisma.financialEntry.findMany({
    where: {
      tipo,
      estornado: false,
      data: inicio || fim ? { gte: inicio, lte: fim } : undefined,
    },
    include: {
      ordemServico: { select: { id: true, status: true, valor_total: true } },
    },
    orderBy: [{ data: "desc" }, { createdAt: "desc" }],
  });
}

interface CreateManualEntryInput {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  data?: Date;
}

export async function createManualEntry(dados: CreateManualEntryInput) {
  return prisma.financialEntry.create({
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: new Prisma.Decimal(dados.valor.toFixed(2)),
      data: dados.data ?? new Date(),
    },
  });
}
