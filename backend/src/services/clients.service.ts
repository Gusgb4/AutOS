import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { calcularPagamento, pagamentosAtivos } from "./serviceOrders.service";

// Veículo arquivado não aparece no cliente (as OS antigas continuam apontando pra ele)
const veiculosAtivos = {
  where: { ativo: true },
  include: { lembretes: { orderBy: { id: "asc" } } },
  orderBy: { created_at: "asc" },
} satisfies Prisma.Client$veiculosArgs;

interface SearchClientsFilters {
  termo?: string;
  // true: só os arquivados; padrão: só os ativos
  arquivados?: boolean;
}

// Busca por nome ou placa, com o resumo de gastos e visitas de cada cliente
export async function search(filtros: SearchClientsFilters = {}) {
  const { termo, arquivados = false } = filtros;

  const clientes = await prisma.client.findMany({
    where: {
      ativo: !arquivados,
      // Anonimizado não é mais um cliente de verdade: só aparece pelas OS antigas
      anonimizado_em: null,
      ...(termo
        ? {
            OR: [
              { nome: { contains: termo, mode: "insensitive" } },
              {
                veiculos: {
                  some: {
                    ativo: true,
                    placa: { contains: termo, mode: "insensitive" },
                  },
                },
              },
            ],
          }
        : {}),
    },
    include: { veiculos: veiculosAtivos },
    orderBy: { nome: "asc" },
  });

  const ids = clientes.map((c) => c.id);
  if (ids.length === 0) return [];

  const [finalizadas, visitas] = await Promise.all([
    // Gasto e quantidade de OS contam só as finalizadas
    prisma.serviceOrder.groupBy({
      by: ["cliente_id"],
      where: { cliente_id: { in: ids }, status: "FINALIZADA" },
      _sum: { valor_total: true },
      _count: { _all: true },
    }),
    // Última visita: OS mais recente que não foi cancelada
    prisma.serviceOrder.groupBy({
      by: ["cliente_id"],
      where: { cliente_id: { in: ids }, status: { not: "CANCELADA" } },
      _max: { created_at: true },
    }),
  ]);

  const gastoPorCliente = new Map(finalizadas.map((g) => [g.cliente_id, g]));
  const visitaPorCliente = new Map(
    visitas.map((v) => [v.cliente_id, v._max?.created_at ?? null]),
  );

  return clientes.map((cliente) => {
    const gasto = gastoPorCliente.get(cliente.id);
    return {
      ...cliente,
      total_gasto: (gasto?._sum?.valor_total ?? new Prisma.Decimal(0))
        .toDecimalPlaces(2)
        .toNumber(),
      qtd_os: gasto?._count?._all ?? 0,
      ultima_visita: visitaPorCliente.get(cliente.id) ?? null,
    };
  });
}

//---------- criar cliente --------------
interface CreateClientInput {
  nome: string;
  telefone: string;
  documento?: string;
  email?: string;
  endereco?: string;
}

export async function create(dados: CreateClientInput) {
  return prisma.client.create({ data: dados });
}

//---------- buscar cliente por id --------------
// Encontra também cliente arquivado: as OS antigas ainda abrem o perfil dele
export async function findById(id: number) {
  return prisma.client.findUnique({
    where: { id },
    include: { veiculos: veiculosAtivos },
  });
}

//---------- atualizar cliente --------------
interface UpdateClientInput {
  nome?: string;
  telefone?: string;
  documento?: string;
  email?: string;
  endereco?: string;
}

export async function update(id: number, dados: UpdateClientInput) {
  await garantirNaoAnonimizado(id);
  return prisma.client.update({ where: { id }, data: dados });
}

//---------- arquivar cliente --------------
export async function archive(id: number) {
  return prisma.client.update({
    where: { id },
    data: { ativo: false, arquivado_em: new Date() },
  });
}

//---------- desarquivar cliente --------------
export async function unarchive(id: number) {
  await garantirNaoAnonimizado(id);
  return prisma.client.update({
    where: { id },
    data: { ativo: true, arquivado_em: null },
  });
}

//---------- anonimizar cliente (LGPD) --------------
export const NOME_ANONIMIZADO = "Cliente removido";

// Cliente anonimizado não volta: editar ou desarquivar permitiria
// preencher de novo os dados que o titular pediu pra apagar
export async function garantirNaoAnonimizado(id: number) {
  const cliente = await prisma.client.findUnique({
    where: { id },
    select: { anonimizado_em: true },
  });
  if (cliente?.anonimizado_em) {
    throw new AppError(
      "Os dados deste cliente foram removidos e ele não pode mais ser alterado.",
      409,
    );
  }
}

// A pedido do titular (LGPD, art. 18): apaga o que identifica a pessoa e mantém
// as OS e o financeiro, que a oficina precisa guardar (art. 16). Não tem volta.
export async function anonimizar(id: number) {
  return prisma.$transaction(async (tx) => {
    const cliente = await tx.client.findUnique({
      where: { id },
      include: {
        ordens_servico: {
          select: {
            id: true,
            status: true,
            valor_total: true,
            financialEntries: pagamentosAtivos,
          },
        },
      },
    });

    if (!cliente) {
      throw new AppError("Cliente não encontrado.", 404);
    }
    if (cliente.anonimizado_em) {
      throw new AppError("Os dados deste cliente já foram removidos.", 409);
    }

    // Com OS em andamento ou dívida, a oficina ainda precisa saber quem é
    // (a lei permite manter os dados pra exercer o direito de cobrar)
    const abertas = cliente.ordens_servico.filter(
      (o) => o.status === "ABERTA" || o.status === "EM_ANDAMENTO",
    );
    if (abertas.length > 0) {
      throw new AppError(
        "Finalize ou cancele as ordens de serviço em aberto antes de remover os dados.",
        409,
      );
    }
    const comSaldo = cliente.ordens_servico.filter(
      (o) =>
        o.status === "FINALIZADA" &&
        calcularPagamento(o, o.financialEntries).saldo.gt(0),
    );
    if (comSaldo.length > 0) {
      throw new AppError(
        "Este cliente tem valores a receber. Receba ou estorne antes de remover os dados.",
        409,
      );
    }

    const agora = new Date();
    const veiculos = await tx.vehicle.findMany({
      where: { cliente_id: id },
      select: { id: true },
    });

    // A placa identifica o dono, então sai também. Fica um texto único no
    // lugar porque a coluna é obrigatória e não pode repetir.
    for (const v of veiculos) {
      await tx.vehicle.update({
        where: { id: v.id },
        data: { placa: `REMOVIDA-${v.id}`, ativo: false, arquivado_em: agora },
      });
    }
    // Lembrete serve pra chamar o cliente de volta, o que não faz mais sentido
    await tx.maintenanceReminder.deleteMany({
      where: { veiculo_id: { in: veiculos.map((v) => v.id) } },
    });

    return tx.client.update({
      where: { id },
      data: {
        nome: NOME_ANONIMIZADO,
        telefone: "",
        documento: null,
        email: null,
        endereco: null,
        ativo: false,
        arquivado_em: cliente.arquivado_em ?? agora,
        anonimizado_em: agora,
      },
    });
  });
}
