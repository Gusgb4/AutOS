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