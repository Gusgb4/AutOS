import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import {
  Periodo,
  arredondar,
  descreverPeriodo,
  filtroOSFinalizada,
} from "./reports.service";

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

export async function produtividade(p: Periodo) {
  const [usuarios, ordens] = await Promise.all([
    prisma.user.findMany({
      select: USER_SELECT,
      orderBy: { nome: "asc" },
    }),
    prisma.serviceOrder.findMany({
      where: filtroOSFinalizada(p),
      select: {
        mecanico_id: true,
        valor_total: true,
        servicos: { select: { valor: true } },
      },
    }),
  ]);

  const zero = () => new Prisma.Decimal(0);
  const porMecanico = new Map<
    number,
    { ordens: number; faturamento: Prisma.Decimal; maoDeObra: Prisma.Decimal }
  >();

  for (const o of ordens) {
    const atual = porMecanico.get(o.mecanico_id) ?? {
      ordens: 0,
      faturamento: zero(),
      maoDeObra: zero(),
    };
    atual.ordens += 1;
    atual.faturamento = atual.faturamento.plus(o.valor_total);
    atual.maoDeObra = o.servicos.reduce(
      (acc, s) => acc.plus(s.valor),
      atual.maoDeObra,
    );
    porMecanico.set(o.mecanico_id, atual);
  }

  const resumir = (
    ordens: number,
    faturamento: Prisma.Decimal,
    maoDeObra: Prisma.Decimal,
  ) => ({
    ordens,
    faturamento: arredondar(faturamento),
    mao_de_obra: arredondar(maoDeObra),
    ticket_medio: arredondar(ordens > 0 ? faturamento.div(ordens) : zero()),
  });

  const membros = usuarios
    .filter((u) => u.ativo || porMecanico.has(u.id))
    .map((u) => {
      const dados = porMecanico.get(u.id);
      return {
        ...u,
        ...resumir(
          dados?.ordens ?? 0,
          dados?.faturamento ?? zero(),
          dados?.maoDeObra ?? zero(),
        ),
      };
    })
    .sort(
      (a, b) => b.faturamento - a.faturamento || a.nome.localeCompare(b.nome),
    );

  const totais = Array.from(porMecanico.values()).reduce(
    (acc, d) => ({
      ordens: acc.ordens + d.ordens,
      faturamento: acc.faturamento.plus(d.faturamento),
      maoDeObra: acc.maoDeObra.plus(d.maoDeObra),
    }),
    { ordens: 0, faturamento: zero(), maoDeObra: zero() },
  );

  return {
    periodo: descreverPeriodo(p),
    resumo: resumir(totais.ordens, totais.faturamento, totais.maoDeObra),
    membros,
  };
}
