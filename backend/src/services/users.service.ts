import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

const USER_SELECT = {
  id: true,
  nome: true,
  email: true,
  perfil: true,
  ativo: true,
} as const;

export async function listGroupedByPerfil() {
  const [usuarios, contagens] = await Promise.all([
    prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { nome: "asc" },
    }),
    // Quantas OS cada mecânico tem, separadas por status
    prisma.serviceOrder.groupBy({
      by: ["mecanico_id", "status"],
      _count: { _all: true },
    }),
  ]);

  // total_os: todas as OS do mecânico, exceto as canceladas
  // os_ativas: as que ainda estão em curso (abertas ou em andamento)
  const porMecanico = new Map<number, { total: number; ativas: number }>();
  for (const c of contagens) {
    if (c.status === "CANCELADA") continue;

    const atual = porMecanico.get(c.mecanico_id) ?? { total: 0, ativas: 0 };
    atual.total += c._count._all;
    if (c.status === "ABERTA" || c.status === "EM_ANDAMENTO") {
      atual.ativas += c._count._all;
    }
    porMecanico.set(c.mecanico_id, atual);
  }

  const comContagem = usuarios.map((u) => ({
    ...u,
    total_os: porMecanico.get(u.id)?.total ?? 0,
    os_ativas: porMecanico.get(u.id)?.ativas ?? 0,
  }));

  return {
    proprietarios: comContagem.filter((u) => u.perfil === "PROPRIETARIO"),
    funcionarios: comContagem.filter((u) => u.perfil === "FUNCIONARIO"),
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
    select: USER_SELECT,
  });
}

//---------- ativar usuário --------------
export async function activate(id: number) {
  return prisma.user.update({
    where: { id },
    data: { ativo: true },
    select: USER_SELECT,
  });
}