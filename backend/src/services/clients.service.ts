import { prisma } from "../config/prisma";

//Busca por nome
export async function search(termo?: string) {
  return prisma.client.findMany({
    where: termo
      ? { nome: { contains: termo, mode: "insensitive" } }
      : undefined,
    include: { veiculos: true },
    orderBy: { nome: "asc" },
  });
}

//---------- criar cliente --------------
interface CreateClientInput {
  nome: string;
  telefone: string;
  documento: string;
}

export async function create(dados: CreateClientInput) {
  return prisma.client.create({ data: dados });
}

//---------- buscar cliente por id --------------
export async function findById(id: number) {
  return prisma.client.findUnique({
    where: { id },
    include: { veiculos: true },
  });
}

//---------- atualizar cliente --------------
interface UpdateClientInput {
  nome?: string;
  telefone?: string;
  documento?: string;
}

export async function update(id: number, dados: UpdateClientInput) {
  return prisma.client.update({ where: { id }, data: dados });
}

//---------- remover cliente --------------
export async function remove(id: number) {
  return prisma.client.delete({ where: { id } });
}