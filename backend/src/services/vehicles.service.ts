import { prisma } from "../config/prisma";

// Busca por placa (parcial, case-insensitive)
export async function search(termo?: string) {
  return prisma.vehicle.findMany({
    where: termo
      ? { placa: { contains: termo, mode: "insensitive" } }
      : undefined,
    include: { cliente: true },
    orderBy: { placa: "asc" },
  });
}

//---------- buscar veículo por id --------------
export async function findById(id: number) {
  return prisma.vehicle.findUnique({
    where: { id },
    include: { cliente: true },
  });
}

//---------- buscar veículo por cliente --------------
interface CreateVehicleInput {
  cliente_id: number;
  placa: string;
  marca: string;
  modelo: string;
  ano: number;
}

export async function create(dados: CreateVehicleInput) {
  return prisma.vehicle.create({ data: dados });
}

//---------- atualizar veículo --------------
interface UpdateVehicleInput {
  cliente_id?: number;
  placa?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
}

export async function update(id: number, dados: UpdateVehicleInput) {
  return prisma.vehicle.update({ where: { id }, data: dados });
}

//---------- remover veículo --------------
export async function remove(id: number) {
  return prisma.vehicle.delete({ where: { id } });
}