import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { garantirNaoAnonimizado } from "./clients.service";

function somarDias(base: Date, dias: number) {
  const data = new Date(base);
  data.setDate(data.getDate() + dias);
  return data;
}

// Lembretes do veículo, na ordem em que foram cadastrados
export const lembretesDoVeiculo = {
  orderBy: { id: "asc" },
} satisfies Prisma.Vehicle$lembretesArgs;

// Busca por placa (parcial, case-insensitive)
export async function search(termo?: string) {
  return prisma.vehicle.findMany({
    where: termo
      ? { placa: { contains: termo, mode: "insensitive" } }
      : undefined,
    include: { cliente: true, lembretes: lembretesDoVeiculo },
    orderBy: { placa: "asc" },
  });
}

//---------- buscar veículo por id --------------
export async function findById(id: number) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { cliente: true, lembretes: lembretesDoVeiculo },
  });
}

// Lembrete enviado pela tela: com id é um que já existe, sem id é novo
export interface LembreteInput {
  id?: number;
  nome: string;
  intervalo_dias: number;
  intervalo_km: number;
}

type Tx = Prisma.TransactionClient;

// A agenda conta a partir de hoje e da quilometragem atual do veículo
function agendaDe(l: LembreteInput, kmAtual: number) {
  return {
    proxima_data: somarDias(new Date(), l.intervalo_dias),
    proximo_km: kmAtual + l.intervalo_km,
  };
}

// Deixa os lembretes do veículo iguais à lista enviada: os que sumiram da
// lista são apagados, os novos são criados e os que continuam só recalculam
// a agenda se o intervalo mudou (editar só o nome não zera a contagem)
async function sincronizarLembretes(
  tx: Tx,
  veiculoId: number,
  kmAtual: number,
  lembretes: LembreteInput[],
) {
  const existentes = await tx.maintenanceReminder.findMany({
    where: { veiculo_id: veiculoId },
  });
  const porId = new Map(existentes.map((l) => [l.id, l]));

  for (const l of lembretes) {
    if (l.id !== undefined && !porId.has(l.id)) {
      throw new AppError("Lembrete não encontrado neste veículo.", 400);
    }
  }

  const mantidos = new Set(lembretes.map((l) => l.id).filter((id) => id !== undefined));
  await tx.maintenanceReminder.deleteMany({
    where: { veiculo_id: veiculoId, id: { notIn: [...mantidos] } },
  });

  for (const l of lembretes) {
    const dados = {
      nome: l.nome,
      intervalo_dias: l.intervalo_dias,
      intervalo_km: l.intervalo_km,
    };
    const atual = l.id !== undefined ? porId.get(l.id) : undefined;

    if (!atual) {
      await tx.maintenanceReminder.create({
        data: { veiculo_id: veiculoId, ...dados, ...agendaDe(l, kmAtual) },
      });
      continue;
    }

    const intervaloMudou =
      atual.intervalo_dias !== l.intervalo_dias ||
      atual.intervalo_km !== l.intervalo_km;
    await tx.maintenanceReminder.update({
      where: { id: atual.id },
      data: intervaloMudou ? { ...dados, ...agendaDe(l, kmAtual) } : dados,
    });
  }
}

//---------- criar veículo (e lembretes) --------------
interface CreateVehicleInput {
  cliente_id: number;
  placa: string;
  cor?: string | null;
  marca: string;
  modelo: string;
  ano: number;
  quilometragem_atual?: number;
  lembretes?: LembreteInput[];
}

export async function create(dados: CreateVehicleInput) {
  const { lembretes, ...dadosVeiculo } = dados;
  await garantirNaoAnonimizado(dados.cliente_id);

  return prisma.$transaction(async (tx) => {
    // "Excluir" um veículo só arquiva (as OS antigas continuam apontando pra
    // ele), então a placa continua ocupada. Cadastrar a mesma placa de novo
    // reaproveita esse veículo: é o mesmo carro, talvez com outro dono agora.
    // Cada OS antiga continua com o cliente da época.
    const arquivado = await tx.vehicle.findFirst({
      where: { placa: dadosVeiculo.placa, ativo: false },
    });
    if (arquivado) {
      await tx.maintenanceReminder.deleteMany({
        where: { veiculo_id: arquivado.id },
      });
    }

    const veiculo = arquivado
      ? await tx.vehicle.update({
          where: { id: arquivado.id },
          data: {
            ...dadosVeiculo,
            cor: dadosVeiculo.cor ?? null,
            quilometragem_atual: dadosVeiculo.quilometragem_atual ?? 0,
            ativo: true,
            arquivado_em: null,
          },
        })
      : await tx.vehicle.create({ data: dadosVeiculo });

    if (lembretes && lembretes.length > 0) {
      await sincronizarLembretes(
        tx,
        veiculo.id,
        veiculo.quilometragem_atual,
        // Veículo novo: todo lembrete é novo, mesmo que venha com id
        lembretes.map((l) => ({ ...l, id: undefined })),
      );
    }

    return tx.vehicle.findUniqueOrThrow({
      where: { id: veiculo.id },
      include: { lembretes: lembretesDoVeiculo },
    });
  });
}

//---------- atualizar veículo (e lembretes) --------------
interface UpdateVehicleInput {
  cliente_id?: number;
  placa?: string;
  cor?: string | null;
  marca?: string;
  modelo?: string;
  ano?: number;
  quilometragem_atual?: number;
  // undefined = não mexe nos lembretes; lista (mesmo vazia) = fica igual a ela
  lembretes?: LembreteInput[];
}

export async function update(id: number, dados: UpdateVehicleInput) {
  const { lembretes, ...dadosVeiculo } = dados;
  await garantirClienteDoVeiculo(id);
  if (dados.cliente_id !== undefined) {
    await garantirNaoAnonimizado(dados.cliente_id);
  }

  return prisma.$transaction(async (tx) => {
    const veiculo = await tx.vehicle.update({
      where: { id },
      data: dadosVeiculo,
    });

    if (lembretes !== undefined) {
      await sincronizarLembretes(tx, id, veiculo.quilometragem_atual, lembretes);
    }

    return tx.vehicle.findUniqueOrThrow({
      where: { id },
      include: { lembretes: lembretesDoVeiculo },
    });
  });
}

// Veículo de cliente anonimizado fica travado (a placa foi apagada de propósito)
async function garantirClienteDoVeiculo(veiculoId: number) {
  const veiculo = await prisma.vehicle.findUnique({
    where: { id: veiculoId },
    select: { cliente_id: true },
  });
  if (veiculo) await garantirNaoAnonimizado(veiculo.cliente_id);
}

//---------- arquivar veículo --------------
export async function archive(id: number) {
  return prisma.vehicle.update({
    where: { id },
    data: { ativo: false, arquivado_em: new Date() },
  });
}

//---------- desarquivar veículo --------------
export async function unarchive(id: number) {
  await garantirClienteDoVeiculo(id);
  return prisma.vehicle.update({
    where: { id },
    data: { ativo: true, arquivado_em: null },
  });
}
