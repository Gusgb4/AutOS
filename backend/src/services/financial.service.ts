import { prisma } from "../config/prisma";

interface Filtros {
  tipo?: string;
  inicio?: string;
  fim?: string;
}

export async function listEntries(filtros: Filtros) {
  const onde: any = {};

  if (filtros.tipo) onde.tipo = filtros.tipo;
  
  if (filtros.inicio || filtros.fim) {
    onde.data = {};
    if (filtros.inicio) onde.data.gte = new Date(filtros.inicio);
    if (filtros.fim) onde.data.lte = new Date(filtros.fim);
  }

  return prisma.financialEntry.findMany({
    where: onde,
    orderBy: { data: 'desc' },
  });
}

export async function createEntry(dados: { tipo: string; descricao: string; valor: number; data?: string }) {
  return prisma.financialEntry.create({
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      data: dados.data ? new Date(dados.data) : new Date(),
      estornado: false
    }
  });
}