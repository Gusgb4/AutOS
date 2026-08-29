import { prisma } from "../config/prisma";

export async function listGroupedByPerfil() {
  const usuarios = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, perfil: true },
    orderBy: { nome: "asc" },
  });

  return {
    proprietarios: usuarios.filter((u) => u.perfil === "PROPRIETARIO"),
    funcionarios: usuarios.filter((u) => u.perfil === "FUNCIONARIO"),
  };
}