import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

// Veículo arquivado não aparece no cliente (as OS antigas continuam apontando pra ele)
const veiculosAtivos = {
  where: { ativo: true },
  include: { lembrete_manutencao: true },
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
  return prisma.client.update({
    where: { id },
    data: { ativo: true, arquivado_em: null },
  });
}
