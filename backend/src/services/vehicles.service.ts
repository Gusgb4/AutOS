import { prisma } from "../config/prisma";

function somarDias(base: Date, dias: number) {
  const data = new Date(base);
  data.setDate(data.getDate() + dias);
  return data;
}

// Busca por placa (parcial, case-insensitive)
export async function search(termo?: string) {
  return prisma.vehicle.findMany({
    where: termo
      ? { placa: { contains: termo, mode: "insensitive" } }
      : undefined,
    include: { cliente: true, lembrete_manutencao: true },
    orderBy: { placa: "asc" },
  });
}

//---------- buscar veículo por id --------------
export async function findById(id: number) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { cliente: true, lembrete_manutencao: true },
  });
}

//---------- criar veículo (e lembrete, se houver intervalos) --------------
interface CreateVehicleInput {
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
  quilometragem_atual?: number;
  intervalo_dias?: number | null;
  intervalo_km?: number | null;
}

export async function create(dados: CreateVehicleInput) {
  const { intervalo_dias, intervalo_km, ...dadosVeiculo } = dados;

  return prisma.$transaction(async (tx) => {
    const veiculo = await tx.vehicle.create({ data: dadosVeiculo });

    if (intervalo_dias != null && intervalo_km != null) {
      await tx.maintenanceReminder.create({
        data: {
          veiculo_id: veiculo.id,
          intervalo_dias,
          intervalo_km,
          proxima_data: somarDias(new Date(), intervalo_dias),
          proximo_km: veiculo.quilometragem_atual + intervalo_km,
        },
      });
    }

    return tx.vehicle.findUniqueOrThrow({
      where: { id: veiculo.id },
      include: { lembrete_manutencao: true },
    });
  });
}

//---------- atualizar veículo (e lembrete) --------------
interface UpdateVehicleInput {
  cliente_id?: number;
  placa?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  quilometragem_atual?: number;
  intervalo_dias?: number | null;
  intervalo_km?: number | null;
}

export async function update(id: number, dados: UpdateVehicleInput) {
  const { intervalo_dias, intervalo_km, ...dadosVeiculo } = dados;

  return prisma.$transaction(async (tx) => {
    const veiculo = await tx.vehicle.update({
      where: { id },
      data: dadosVeiculo,
    });

    // undefined nos dois = não mexe no lembrete
    if (intervalo_dias !== undefined || intervalo_km !== undefined) {
      if (intervalo_dias == null || intervalo_km == null) {
        // dois em branco = remove o lembrete
        await tx.maintenanceReminder.deleteMany({ where: { veiculo_id: id } });
      } else {
        const existente = await tx.maintenanceReminder.findUnique({
          where: { veiculo_id: id },
        });

        // só recalcula a agenda se os intervalos realmente mudaram;
        // editar a placa, por exemplo, não pode "zerar" o relógio da revisão
        const mudou =
          !existente ||
          existente.intervalo_dias !== intervalo_dias ||
          existente.intervalo_km !== intervalo_km;

        if (mudou) {
          const agenda = {
            intervalo_dias,
            intervalo_km,
            proxima_data: somarDias(new Date(), intervalo_dias),
            proximo_km: veiculo.quilometragem_atual + intervalo_km,
          };

          await tx.maintenanceReminder.upsert({
            where: { veiculo_id: id },
            create: { veiculo_id: id, ...agenda },
            update: agenda,
          });
        }
      }
    }

    return tx.vehicle.findUniqueOrThrow({
      where: { id },
      include: { lembrete_manutencao: true },
    });
  });
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
  return prisma.vehicle.update({
    where: { id },
    data: { ativo: true, arquivado_em: null },
  });
}
