import {
  FormaPagamento,
  Perfil,
  Prisma,
  StatusOrdemServico,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

type Tx = Prisma.TransactionClient;

export type StatusPagamento = "PENDENTE" | "PARCIAL" | "PAGO";

export const pagamentosAtivos = {
  where: { tipo: "RECEITA", estornado: false },
  select: { valor: true },
} satisfies Prisma.ServiceOrder$financialEntriesArgs;

const ordemCompleta = {
  cliente: true,
  veiculo: true,
  mecanico: { select: { id: true, nome: true, email: true, perfil: true } },
  servicos: true,
  // Preço de custo é só do proprietário, e as rotas de OS atendem os dois perfis
  pecas: { include: { item_estoque: { omit: { valor_entrada: true } } } },
  financialEntries: pagamentosAtivos,
} satisfies Prisma.ServiceOrderInclude;

type OrdemCompleta = Prisma.ServiceOrderGetPayload<{
  include: typeof ordemCompleta;
}>;

const STATUS_EDITAVEIS: StatusOrdemServico[] = ["ABERTA", "EM_ANDAMENTO"];

const TRANSICOES: Record<StatusOrdemServico, StatusOrdemServico[]> = {
  ABERTA: ["EM_ANDAMENTO", "CANCELADA"],
  EM_ANDAMENTO: ["FINALIZADA", "CANCELADA"],
  FINALIZADA: ["EM_ANDAMENTO"],
  CANCELADA: [],
};

export function calcularPagamento(
  ordem: { status: StatusOrdemServico; valor_total: Prisma.Decimal },
  pagamentos: { valor: Prisma.Decimal }[],
) {
  const valor_pago = pagamentos.reduce(
    (acc, pagamento) => acc.plus(pagamento.valor),
    new Prisma.Decimal(0),
  );
  const saldo = ordem.valor_total.minus(valor_pago);

  let status_pagamento: StatusPagamento | null = null;
  if (ordem.status === "FINALIZADA") {
    if (saldo.lte(0)) status_pagamento = "PAGO";
    else if (valor_pago.gt(0)) status_pagamento = "PARCIAL";
    else status_pagamento = "PENDENTE";
  }

  return { valor_pago, saldo, status_pagamento };
}

export function comPagamento<
  T extends {
    status: StatusOrdemServico;
    valor_total: Prisma.Decimal;
    financialEntries: { valor: Prisma.Decimal }[];
  },
>({ financialEntries, ...ordem }: T) {
  return { ...ordem, ...calcularPagamento(ordem, financialEntries) };
}

// A margem considera só as peças com custo registrado. As antigas, sem
// valor_custo, ficam fora da conta para não inflar a margem.
export function calcularMargemPecas(
  pecas: {
    quantidade: number;
    valor_unitario: Prisma.Decimal;
    valor_custo: Prisma.Decimal | null;
  }[],
) {
  let receita = new Prisma.Decimal(0);
  let custo = new Prisma.Decimal(0);
  let valor_sem_custo = new Prisma.Decimal(0);
  let pecas_com_custo = 0;
  let pecas_sem_custo = 0;

  for (const peca of pecas) {
    const venda = peca.valor_unitario.mul(peca.quantidade);
    if (peca.valor_custo === null) {
      valor_sem_custo = valor_sem_custo.plus(venda);
      pecas_sem_custo += 1;
    } else {
      receita = receita.plus(venda);
      custo = custo.plus(peca.valor_custo.mul(peca.quantidade));
      pecas_com_custo += 1;
    }
  }

  const margem = receita.minus(custo);
  const percentual = receita.gt(0)
    ? margem.div(receita).mul(100).toDecimalPlaces(1)
    : null;

  return {
    receita,
    custo,
    margem,
    percentual,
    pecas_com_custo,
    pecas_sem_custo,
    valor_sem_custo,
  };
}

// Custo e margem são só do proprietário: para os outros perfis o valor_custo
// sai de cada peça e a margem nem é calculada
function formatarOrdem(ordem: OrdemCompleta, perfil: Perfil | undefined) {
  const formatada = comPagamento(ordem);

  if (perfil !== "PROPRIETARIO") {
    return {
      ...formatada,
      pecas: formatada.pecas.map(({ valor_custo, ...peca }) => peca),
    };
  }

  return { ...formatada, margem_pecas: calcularMargemPecas(formatada.pecas) };
}

async function travarOrdem(tx: Tx, ordemId: number) {
  await tx.$queryRaw`SELECT id FROM service_orders WHERE id = ${ordemId} FOR UPDATE`;

  const ordem = await tx.serviceOrder.findUnique({
    where: { id: ordemId },
    include: { financialEntries: pagamentosAtivos },
  });

  if (!ordem) {
    throw new AppError("Ordem de serviço não encontrada.", 404);
  }

  return ordem;
}

async function recalcularTotal(
  tx: Tx,
  ordemId: number,
  perfil: Perfil | undefined,
) {
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

  const ordem = await tx.serviceOrder.update({
    where: { id: ordemId },
    data: { valor_total: total },
    include: ordemCompleta,
  });

  return formatarOrdem(ordem, perfil);
}

function somarDias(data: Date, dias: number): Date {
  const resultado = new Date(data);
  resultado.setDate(resultado.getDate() + dias);
  return resultado;
}

async function recalcularLembreteManutencao(tx: Tx, veiculoId: number) {
  const lembrete = await tx.maintenanceReminder.findUnique({
    where: { veiculo_id: veiculoId },
  });

  if (!lembrete) {
    return;
  }

  const veiculo = await tx.vehicle.findUniqueOrThrow({
    where: { id: veiculoId },
  });

  await tx.maintenanceReminder.update({
    where: { veiculo_id: veiculoId },
    data: {
      proxima_data: somarDias(new Date(), lembrete.intervalo_dias),
      proximo_km: veiculo.quilometragem_atual + lembrete.intervalo_km,
    },
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

interface SearchServiceOrdersFilters {
  status?: StatusOrdemServico;
  cliente_id?: number;
  status_pagamento?: StatusPagamento;
}

export async function search(
  filtros: SearchServiceOrdersFilters,
  perfil: Perfil | undefined,
) {
  const ordens = await prisma.serviceOrder.findMany({
    // Campos undefined são ignorados pelo Prisma: cada filtro é opcional
    where: { status: filtros.status, cliente_id: filtros.cliente_id },
    include: ordemCompleta,
    orderBy: { created_at: "desc" },
  });

  return ordens
    .map((ordem) => formatarOrdem(ordem, perfil))
    .filter(
      (ordem) =>
        !filtros.status_pagamento ||
        ordem.status_pagamento === filtros.status_pagamento,
    );
}

export async function findById(id: number, perfil: Perfil | undefined) {
  const ordem = await prisma.serviceOrder.findUnique({
    where: { id },
    include: ordemCompleta,
  });

  return ordem && formatarOrdem(ordem, perfil);
}

interface CreateServiceOrderInput {
  cliente_id: number;
  veiculo_id: number;
  mecanico_id: number;
  quilometragem_registrada?: number;
  observacoes?: string | null;
  reclamacao?: string | null;
  previsao_entrega?: Date | null;
}

export async function create(
  dados: CreateServiceOrderInput,
  perfil: Perfil | undefined,
) {
  const veiculo = await prisma.vehicle.findUnique({
    where: { id: dados.veiculo_id },
  });

  if (veiculo && veiculo.cliente_id !== dados.cliente_id) {
    throw new AppError(
      "O veículo informado não pertence ao cliente informado.",
      400,
    );
  }

  // Valida inconsistência de hodômetro apenas se aferido na abertura da OS
  if (
    veiculo &&
    dados.quilometragem_registrada !== undefined &&
    dados.quilometragem_registrada < veiculo.quilometragem_atual
  ) {
    throw new AppError(
      `A quilometragem informada (${dados.quilometragem_registrada} km) não pode ser menor que a quilometragem atual do veículo (${veiculo.quilometragem_atual} km).`,
      400,
    );
  }

  return prisma.$transaction(async (tx) => {
    // Sincroniza a quilometragem atual do veículo com a OS
    if (veiculo && dados.quilometragem_registrada !== undefined) {
      await tx.vehicle.update({
        where: { id: dados.veiculo_id },
        data: { quilometragem_atual: dados.quilometragem_registrada },
      });
    }

    const ordem = await tx.serviceOrder.create({
      data: dados,
      include: ordemCompleta,
    });

    return formatarOrdem(ordem, perfil);
  });
}

export async function addPart(
  ordemId: number,
  itemId: number,
  quantidade: number,
  perfil: Perfil | undefined,
) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    const { count } = await tx.stockItem.updateMany({
      where: { id: itemId, ativo: true, quantidade: { gte: quantidade } },
      data: { quantidade: { decrement: quantidade } },
    });

    if (count === 0) {
      const indisponivel = await tx.stockItem.findUnique({
        where: { id: itemId },
      });

      if (!indisponivel) {
        throw new AppError("Item de estoque não encontrado.", 404);
      }

      if (!indisponivel.ativo) {
        throw new AppError(
          `O item "${indisponivel.nome}" está arquivado e não pode ser usado em novas OS.`,
          409,
        );
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
        valor_unitario: item.valor_final,
        valor_custo: item.valor_entrada,
      },
      // Preço e custo ficam os da primeira inclusão da peça na OS
      update: { quantidade: { increment: quantidade } },
    });

    const ordem = await recalcularTotal(tx, ordemId, perfil);

    return {
      ordem,
      estoque_restante: item.quantidade,
      alerta_minimo: item.quantidade <= item.quantidade_minima,
    };
  });
}

export async function removePart(
  ordemId: number,
  partId: number,
  perfil: Perfil | undefined,
) {
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

    return recalcularTotal(tx, ordemId, perfil);
  });
}

interface AddServiceInput {
  descricao: string;
  valor: number;
}

export async function addService(
  ordemId: number,
  dados: AddServiceInput,
  perfil: Perfil | undefined,
) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    await tx.serviceOrderService.create({
      data: {
        ordem_id: ordemId,
        descricao: dados.descricao,
        valor: dados.valor,
      },
    });

    return recalcularTotal(tx, ordemId, perfil);
  });
}

export async function removeService(
  ordemId: number,
  serviceId: number,
  perfil: Perfil | undefined,
) {
  return prisma.$transaction(async (tx) => {
    await buscarOrdemEditavel(tx, ordemId);

    const servico = await tx.serviceOrderService.findUnique({
      where: { id: serviceId },
    });

    if (!servico || servico.ordem_id !== ordemId) {
      throw new AppError("Serviço não encontrado nesta ordem de serviço.", 404);
    }

    await tx.serviceOrderService.delete({ where: { id: serviceId } });

    return recalcularTotal(tx, ordemId, perfil);
  });
}

export async function changeStatus(
  ordemId: number,
  novoStatus: StatusOrdemServico,
  perfil: Perfil | undefined,
) {
  return prisma.$transaction(async (tx) => {
    const ordem = await travarOrdem(tx, ordemId);

    if (!TRANSICOES[ordem.status].includes(novoStatus)) {
      throw new AppError(
        `Não é possível mudar o status de ${ordem.status} para ${novoStatus}.`,
        409,
      );
    }
    if (novoStatus === "CANCELADA" && ordem.financialEntries.length > 0) {
      throw new AppError("Estorne os pagamentos antes de cancelar.", 409);
    }

    const { count } = await tx.serviceOrder.updateMany({
      where: { id: ordemId, status: ordem.status },
      data: {
        status: novoStatus,
        finalizada_em: novoStatus === "FINALIZADA" ? new Date() : null,
      },
    });

    if (count === 0) {
      throw new AppError(
        "O status da ordem foi alterado por outra requisição.",
        409,
      );
    }

    if (novoStatus === "FINALIZADA") {
      await recalcularLembreteManutencao(tx, ordem.veiculo_id);
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

    const atualizada = await tx.serviceOrder.findUniqueOrThrow({
      where: { id: ordemId },
      include: ordemCompleta,
    });

    return formatarOrdem(atualizada, perfil);
  });
}

interface DetalhesOrdemInput {
  observacoes?: string | null;
  reclamacao?: string | null;
  previsao_entrega?: Date | null;
}

// Reclamação, previsão de entrega e informações ao cliente.
// undefined = não mexe; null = apaga
export async function updateDetalhes(
  ordemId: number,
  dados: DetalhesOrdemInput,
  perfil: Perfil | undefined,
) {
  const ordem = await prisma.serviceOrder.findUnique({
    where: { id: ordemId },
  });

  if (!ordem) {
    throw new AppError("Ordem de serviço não encontrada.", 404);
  }

  const atualizada = await prisma.serviceOrder.update({
    where: { id: ordemId },
    data: dados,
    include: ordemCompleta,
  });

  return formatarOrdem(atualizada, perfil);
}

interface RegistrarPagamentoInput {
  valor: number;
  forma_pagamento: FormaPagamento;
  data?: Date;
}

export async function registrarPagamento(
  ordemId: number,
  dados: RegistrarPagamentoInput,
) {
  return prisma.$transaction(async (tx) => {
    const ordem = await travarOrdem(tx, ordemId);

    if (ordem.status !== "FINALIZADA") {
      throw new AppError(
        "Só é possível registrar pagamento de OS finalizada.",
        409,
      );
    }

    const valor = new Prisma.Decimal(dados.valor).toDecimalPlaces(2);
    const { saldo } = calcularPagamento(ordem, ordem.financialEntries);

    if (saldo.lte(0)) {
      throw new AppError("Esta ordem de serviço já está paga.", 409);
    }
    if (valor.lte(0) || valor.gt(saldo)) {
      throw new AppError(
        `O valor deve ser maior que zero e no máximo o saldo de R$ ${saldo.toFixed(2).replace(".", ",")}.`,
        409,
      );
    }

    return tx.financialEntry.create({
      data: {
        tipo: "RECEITA",
        descricao: `Pagamento da Ordem de Serviço #${ordem.id}`,
        valor,
        forma_pagamento: dados.forma_pagamento,
        data: dados.data ?? new Date(),
        ordemId: ordem.id,
      },
    });
  });
}

export async function listarPagamentos(ordemId: number) {
  const ordem = await prisma.serviceOrder.findUnique({
    where: { id: ordemId },
  });

  if (!ordem) {
    throw new AppError("Ordem de serviço não encontrada.", 404);
  }

  return prisma.financialEntry.findMany({
    where: { ordemId, tipo: "RECEITA" },
    orderBy: { data: "asc" },
  });
}

export async function estornarPagamento(ordemId: number, pagamentoId: string) {
  const pagamento = await prisma.financialEntry.findFirst({
    where: { id: pagamentoId, ordemId, tipo: "RECEITA" },
  });

  if (!pagamento) {
    throw new AppError("Pagamento não encontrado nesta ordem de serviço.", 404);
  }

  const { count } = await prisma.financialEntry.updateMany({
    where: { id: pagamentoId, estornado: false },
    data: { estornado: true },
  });

  if (count === 0) {
    throw new AppError("Este pagamento já foi estornado.", 409);
  }

  return prisma.financialEntry.findUniqueOrThrow({
    where: { id: pagamentoId },
  });
}
