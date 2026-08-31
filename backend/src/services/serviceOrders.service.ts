import { Prisma, StatusOrdemServico } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

type Tx = Prisma.TransactionClient;

const ordemCompleta = {
  cliente: true,
  veiculo: true,
  mecanico: { select: { id: true, nome: true, email: true, perfil: true } },
  servicos: true,
  pecas: { include: { item_estoque: true } },
} satisfies Prisma.ServiceOrderInclude;

const STATUS_EDITAVEIS: StatusOrdemServico[] = ["ABERTA", "EM_ANDAMENTO"];

const TRANSICOES: Record<StatusOrdemServico, StatusOrdemServico[]> = {
  ABERTA: ["EM_ANDAMENTO", "CANCELADA"],
  EM_ANDAMENTO: ["FINALIZADA", "CANCELADA"],
  FINALIZADA: [],
  CANCELADA: [],
};

async function recalcularTotal(tx: Tx, ordemId: number) {
  const [servicos, pecas] = await Promise.all([
    tx.serviceOrderService.findMany({
      where: { ordem_id: ordemId },
      select: { valor: true },
    }),
    tx.serviceOrderPart.findMany({
      where: { ordem_id: ordemId },
      select: { quantidade: true, valor_unitario: true },
    }),
  ]);

  const total = [
    ...servicos.map((servico) => servico.valor),
    ...pecas.map((peca) => peca.valor_unitario.mul(peca.quantidade)),
  ].reduce((acc, valor) => acc.plus(valor), new Prisma.Decimal(0));

  return tx.serviceOrder.update({
    where: { id: ordemId },
    data: { valor_total: total },
    include: ordemCompleta,
  });
}

async function buscarOrdemEditavel(tx: Tx, ordemId: number) {
  const ordem = await tx.serviceOrder.findUnique({ where: { id: ordemId } });

  if (!ordem) {
    throw new AppError("Ordem de serviço não encontrada.", 404);
  }
  if (!STATUS_EDITAVEIS.includes(ordem.status)) {
    throw new AppError(
      "Ordem de serviço finalizada ou cancelada não pode ser alterada.",
      409,
    );
  }

  return ordem;
}

export async function search(status?: StatusOrdemServico) {
  return prisma.serviceOrder.findMany({
    where: status ? { status } : undefined,
    include: ordemCompleta,
    orderBy: { created_at: "desc" },
  });
}

export async function findById(id: number) {
  return prisma.serviceOrder.findUnique({
    where: { id },
    include: ordemCompleta,
  });
}

interface CreateServiceOrderInput {
  cliente_id: number;
  veiculo_id: number;
  mecanico_id: number;
}

export async function create(dados: CreateServiceOrderInput) {
  const veiculo = await prisma.vehicle.findUnique({
    where: { id: dados.veiculo_id },
  });

  if (veiculo && veiculo.cliente_id !== dados.cliente_id) {
    throw new AppError(
      "O veículo informado não pertence ao cliente informado.",
      400,
    );
  }

  return prisma.serviceOrder.create({
    data: dados,
    include: ordemCompleta,
  });
}

export async function addPart(
  ordemId: number,
  itemId: number,
  quantidade: number,
) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    const { count } = await tx.stockItem.updateMany({
      where: { id: itemId, quantidade: { gte: quantidade } },
      data: { quantidade: { decrement: quantidade } },
    });

    if (count === 0) {
      const indisponivel = await tx.stockItem.findUnique({
        where: { id: itemId },
      });

      if (!indisponivel) {
        throw new AppError("Item de estoque não encontrado.", 404);
      }
      throw new AppError(
        `Estoque insuficiente de "${indisponivel.nome}". Disponível: ${indisponivel.quantidade}.`,
        409,
      );
    }

    const item = await tx.stockItem.findUniqueOrThrow({
      where: { id: itemId },
    });

    await tx.serviceOrderPart.upsert({
      where: {
        ordem_id_item_estoque_id: {
          ordem_id: ordemId,
          item_estoque_id: itemId,
        },
      },
      create: {
        ordem_id: ordemId,
        item_estoque_id: itemId,
        quantidade,
        valor_unitario: item.valor_unitario,
      },
      update: { quantidade: { increment: quantidade } },
    });

    const ordem = await recalcularTotal(tx, ordemId);

    return {
      ordem,
      estoque_restante: item.quantidade,
      alerta_minimo: item.quantidade <= item.quantidade_minima,
    };
  });
}

export async function removePart(ordemId: number, partId: number) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    const peca = await tx.serviceOrderPart.findUnique({
      where: { id: partId },
    });

    if (!peca || peca.ordem_id !== ordemId) {
      throw new AppError("Peça não encontrada nesta ordem de serviço.", 404);
    }

    await tx.serviceOrderPart.delete({ where: { id: partId } });

    await tx.stockItem.update({
      where: { id: peca.item_estoque_id },
      data: { quantidade: { increment: peca.quantidade } },
    });

    return recalcularTotal(tx, ordemId);
  });
}

interface AddServiceInput {
  descricao: string;
  valor: number;
}

export async function addService(ordemId: number, dados: AddServiceInput) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    await tx.serviceOrderService.create({
      data: {
        ordem_id: ordemId,
        descricao: dados.descricao,
        valor: dados.valor,
      },
    });

    return recalcularTotal(tx, ordemId);
  });
}

export async function removeService(ordemId: number, serviceId: number) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    const servico = await tx.serviceOrderService.findUnique({
      where: { id: serviceId },
    });

    if (!servico || servico.ordem_id !== ordemId) {
      throw new AppError("Serviço não encontrado nesta ordem de serviço.", 404);
    }

    await tx.serviceOrderService.delete({ where: { id: serviceId } });

    return recalcularTotal(tx, ordemId);
  });
}

export async function changeStatus(
  ordemId: number,
  novoStatus: StatusOrdemServico,
) {
  return prisma.$transaction(async (tx) => {
    const ordem = await tx.serviceOrder.findUnique({ where: { id: ordemId } });

    if (!ordem) {
      throw new AppError("Ordem de serviço não encontrada.", 404);
    }
    if (!TRANSICOES[ordem.status].includes(novoStatus)) {
      throw new AppError(
        `Não é possível mudar o status de ${ordem.status} para ${novoStatus}.`,
        409,
      );
    }

    const { count } = await tx.serviceOrder.updateMany({
      where: { id: ordemId, status: ordem.status },
      data: { status: novoStatus },
    });

    if (count === 0) {
      throw new AppError(
        "O status da ordem foi alterado por outra requisição.",
        409,
      );
    }

    if (novoStatus === "CANCELADA") {
      const pecas = await tx.serviceOrderPart.findMany({
        where: { ordem_id: ordemId },
      });

      for (const peca of pecas) {
        await tx.stockItem.update({
          where: { id: peca.item_estoque_id },
          data: { quantidade: { increment: peca.quantidade } },
        });
      }
    }

    return tx.serviceOrder.findUniqueOrThrow({
      where: { id: ordemId },
      include: ordemCompleta,
    });
  });
}

export async function updateObservacoes(
  ordemId: number,
  observacoes: string | undefined,
) {
  const ordem = await prisma.serviceOrder.findUnique({
    where: { id: ordemId },
  });

  if (!ordem) {
    throw new AppError("Ordem de serviço não encontrada.", 404);
  }

  return prisma.serviceOrder.update({
    where: { id: ordemId },
    data: { observacoes },
    include: ordemCompleta,
  });
}
