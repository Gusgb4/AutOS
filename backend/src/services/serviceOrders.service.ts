import {
  FormaPagamento,
  Prisma,
  StatusOrdemServico,
  StatusPagamento,
} from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

type Tx = Prisma.TransactionClient;

const ordemCompleta = {
  cliente: true,
  veiculo: true,
  mecanico: { select: { id: true, nome: true, email: true, perfil: true } },
  servicos: true,
  // Preço de custo é só do proprietário, e as rotas de OS atendem os dois perfis
  pecas: { include: { item_estoque: { omit: { valor_entrada: true } } } },
} satisfies Prisma.ServiceOrderInclude;

const STATUS_EDITAVEIS: StatusOrdemServico[] = ["ABERTA", "EM_ANDAMENTO"];

const TRANSICOES: Record<StatusOrdemServico, StatusOrdemServico[]> = {
  ABERTA: ["EM_ANDAMENTO", "CANCELADA"],
  EM_ANDAMENTO: ["FINALIZADA", "CANCELADA"],
  FINALIZADA: ["EM_ANDAMENTO"],
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

function calcularStatusPagamento(
  valorPago: Prisma.Decimal,
  valorTotal: Prisma.Decimal,
): StatusPagamento {
  if (valorPago.gte(valorTotal)) return "PAGO";
  if (valorPago.gt(0)) return "PARCIAL";
  return "PENDENTE";
}

// Pagamentos da OS = receitas vinculadas a ela que não foram estornadas
async function atualizarPagamento(tx: Tx, ordemId: number) {
  const ordem = await tx.serviceOrder.findUniqueOrThrow({
    where: { id: ordemId },
    select: { valor_total: true },
  });
  const { _sum } = await tx.financialEntry.aggregate({
    where: { ordemId, tipo: "RECEITA", estornado: false },
    _sum: { valor: true },
  });
  const valorPago = _sum.valor ?? new Prisma.Decimal(0);

  return tx.serviceOrder.update({
    where: { id: ordemId },
    data: {
      valor_pago: valorPago,
      status_pagamento: calcularStatusPagamento(valorPago, ordem.valor_total),
    },
    include: ordemCompleta,
  });
}

// Trava a linha da OS até o fim da transação, para dois pagamentos
// simultâneos não passarem juntos pela checagem de saldo
async function travarOrdem(tx: Tx, ordemId: number) {
  await tx.$queryRaw`SELECT id FROM "service_orders" WHERE id = ${ordemId} FOR UPDATE`;
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
  status_pagamento?: StatusPagamento;
  cliente_id?: number;
}

export async function search(filtros: SearchServiceOrdersFilters = {}) {
  // Situação de pagamento só faz sentido para OS finalizada
  const status =
    filtros.status ?? (filtros.status_pagamento ? "FINALIZADA" : undefined);

  return prisma.serviceOrder.findMany({
    // Campos undefined são ignorados pelo Prisma: cada filtro é opcional
    where: {
      status,
      status_pagamento: filtros.status_pagamento,
      cliente_id: filtros.cliente_id,
    },
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
  quilometragem_registrada?: number;
  observacoes?: string;
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

    return tx.serviceOrder.create({
      data: dados,
      include: ordemCompleta,
    });
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
        valor_unitario: item.valor_final,
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

    // A receita não é mais gerada no encerramento: ela entra no financeiro
    // conforme o proprietário registra os pagamentos (contas a receber).
    // Reabrir a OS mantém os pagamentos já recebidos.
    if (novoStatus === "FINALIZADA") {
      await recalcularLembreteManutencao(tx, ordem.veiculo_id);
    }

    // Se a OS foi cancelada, estorna o financeiro e devolve as peças
    if (novoStatus === "CANCELADA") {
      await tx.financialEntry.updateMany({
        where: { ordemId: ordemId, estornado: false },
        data: { estornado: true },
      });

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

    return atualizarPagamento(tx, ordemId);
  });
}

// ---------- Pagamentos (contas a receber) ----------

function buscarPagamentosDaOrdem(tx: Tx, ordemId: number) {
  return tx.financialEntry.findMany({
    where: {
      ordemId,
      tipo: "RECEITA",
      // Receitas automáticas antigas que foram estornadas na reabertura
      // (antes das contas a receber) não são pagamentos reais
      OR: [{ estornado: false }, { forma_pagamento: { not: null } }],
    },
    orderBy: [{ data: "asc" }, { createdAt: "asc" }],
  });
}

export async function listarPagamentos(ordemId: number) {
  const ordem = await prisma.serviceOrder.findUnique({
    where: { id: ordemId },
    select: { id: true },
  });

  if (!ordem) {
    throw new AppError("Ordem de serviço não encontrada.", 404);
  }

  return buscarPagamentosDaOrdem(prisma, ordemId);
}

const FORMA_PAGAMENTO_LABEL: Record<FormaPagamento, string> = {
  DINHEIRO: "dinheiro",
  PIX: "Pix",
  CARTAO_DEBITO: "cartão de débito",
  CARTAO_CREDITO: "cartão de crédito",
  BOLETO: "boleto",
  TRANSFERENCIA: "transferência",
};

interface RegistrarPagamentoInput {
  valor: number;
  forma_pagamento: FormaPagamento;
  data: Date;
}

export async function registrarPagamento(
  ordemId: number,
  dados: RegistrarPagamentoInput,
) {
  return prisma.$transaction(async (tx) => {
    await travarOrdem(tx, ordemId);
    const ordem = await tx.serviceOrder.findUnique({ where: { id: ordemId } });

    if (!ordem) {
      throw new AppError("Ordem de serviço não encontrada.", 404);
    }
    if (ordem.status !== "FINALIZADA") {
      throw new AppError(
        "Só é possível registrar pagamento de uma OS finalizada.",
        409,
      );
    }

    const saldo = ordem.valor_total.minus(ordem.valor_pago);
    const valor = new Prisma.Decimal(dados.valor).toDecimalPlaces(2);

    if (saldo.lte(0)) {
      throw new AppError("Esta OS já está totalmente paga.", 409);
    }
    if (valor.gt(saldo)) {
      throw new AppError(
        `O valor informado é maior que o saldo da OS (R$ ${saldo.toFixed(2).replace(".", ",")}).`,
        400,
      );
    }

    await tx.financialEntry.create({
      data: {
        tipo: "RECEITA",
        descricao: `Pagamento da OS #${ordem.id} (${FORMA_PAGAMENTO_LABEL[dados.forma_pagamento]})`,
        valor,
        data: dados.data,
        forma_pagamento: dados.forma_pagamento,
        ordemId: ordem.id,
      },
    });

    return atualizarPagamento(tx, ordemId);
  });
}

export async function estornarPagamento(ordemId: number, pagamentoId: string) {
  return prisma.$transaction(async (tx) => {
    await travarOrdem(tx, ordemId);
    const pagamento = await tx.financialEntry.findUnique({
      where: { id: pagamentoId },
    });

    if (
      !pagamento ||
      pagamento.ordemId !== ordemId ||
      pagamento.tipo !== "RECEITA"
    ) {
      throw new AppError("Pagamento não encontrado nesta ordem de serviço.", 404);
    }
    if (pagamento.estornado) {
      throw new AppError("Este pagamento já foi estornado.", 409);
    }

    await tx.financialEntry.update({
      where: { id: pagamentoId },
      data: { estornado: true },
    });

    return atualizarPagamento(tx, ordemId);
  });
}

// OS finalizadas com saldo em aberto, da mais antiga para a mais recente
export async function listarAReceber() {
  const ordens = await prisma.serviceOrder.findMany({
    where: {
      status: "FINALIZADA",
      status_pagamento: { in: ["PENDENTE", "PARCIAL"] },
    },
    select: {
      id: true,
      valor_total: true,
      valor_pago: true,
      status_pagamento: true,
      created_at: true,
      cliente: { select: { id: true, nome: true, telefone: true } },
      veiculo: { select: { id: true, placa: true, marca: true, modelo: true } },
    },
    orderBy: { created_at: "asc" },
  });

  const comSaldo = ordens.map((ordem) => ({
    ...ordem,
    saldo: ordem.valor_total.minus(ordem.valor_pago),
  }));

  return {
    total: comSaldo.reduce(
      (acc, ordem) => acc.plus(ordem.saldo),
      new Prisma.Decimal(0),
    ),
    ordens: comSaldo,
  };
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
