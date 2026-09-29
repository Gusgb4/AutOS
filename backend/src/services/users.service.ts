import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

export async function listGroupedByPerfil() {
  const usuarios = await prisma.user.findMany({
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
    orderBy: { nome: "asc" },
  });

  return {
    proprietarios: usuarios.filter((u) => u.perfil === "PROPRIETARIO"),
    funcionarios: usuarios.filter((u) => u.perfil === "FUNCIONARIO"),
  };
}

//---------- desativar usuário --------------
export async function deactivate(id: number, requesterId: number) {
  if (id === requesterId) {
    throw new AppError("Você não pode desativar sua própria conta.", 400);
  }

  return prisma.user.update({
    where: { id },
    data: { ativo: false },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });
}

//---------- ativar usuário --------------
export async function activate(id: number) {
  return prisma.user.update({
    where: { id },
    data: { ativo: true },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });
}