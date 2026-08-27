import { prisma } from "../config/prisma";

// TODO (CRUD de clientes): create(dados), update(id, dados), remove(id), findById(id)

// Busca por nome (parcial, case-insensitive) — atende ao requisito de busca por nome.
export async function search(termo?: string) {
  return prisma.client.findMany({
    where: termo
      ? { nome: { contains: termo, mode: "insensitive" } }
      : undefined,
    include: { veiculos: true },
    orderBy: { nome: "asc" },
  });
}