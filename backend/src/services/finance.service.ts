import { Prisma, TipoLancamento } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

const lancamentoCompleto = {
  ordem: { select: { id: true, status: true, valor_total: true } },
} satisfies Prisma.FinancialEntryInclude;

interface SearchEntriesInput {
  tipo?: TipoLancamento;
  inicio?: Date;
  fim?: Date;
  incluir_estornados?: boolean;
}

export async function searchEntries(filtros: SearchEntriesInput = {}) {
  const { tipo, inicio, fim, incluir_estornados } = filtros;

  return prisma.financialEntry.findMany({
    where: {
      tipo,
      estornado: incluir_estornados ? undefined : false,
      data: inicio || fim ? { gte: inicio, lte: fim } : undefined,
    },
    include: lancamentoCompleto,
    orderBy: [{ data: "desc" }, { id: "desc" }],
  });
}

export async function findEntryById(id: number) {
  return prisma.financialEntry.findUnique({
    where: { id },
    include: lancamentoCompleto,
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
    include: lancamentoCompleto,
  });
}

interface UpdateManualEntryInput {
  tipo?: TipoLancamento;
  descricao?: string;
  valor?: number;
  data?: Date;
}

async function buscarLancamentoManual(id: number) {
  const lancamento = await prisma.financialEntry.findUnique({ where: { id } });

  if (!lancamento) {
    throw new AppError("Lançamento financeiro não encontrado.", 404);
  }
  if (lancamento.ordem_id !== null) {
    throw new AppError(
      "Lançamento gerado por ordem de serviço não pode ser alterado manualmente.",
      409,
    );
  }

  return lancamento;
}

export async function updateManualEntry(
  id: number,
  dados: UpdateManualEntryInput,
) {
  await buscarLancamentoManual(id);

  return prisma.financialEntry.update({
    where: { id },
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor:
        dados.valor === undefined
          ? undefined
          : new Prisma.Decimal(dados.valor.toFixed(2)),
      data: dados.data,
    },
    include: lancamentoCompleto,
  });
}

export async function deleteManualEntry(id: number) {
  await buscarLancamentoManual(id);

  await prisma.financialEntry.delete({ where: { id } });
}
