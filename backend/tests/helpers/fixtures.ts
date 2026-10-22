import { prisma } from "../../src/config/prisma";

let contador = 0;
function proximo() {
  contador += 1;
  return contador;
}

export async function criarClienteComVeiculo(overrides?: {
  quilometragem_atual?: number;
}) {
  const n = proximo();
  const cliente = await prisma.client.create({
    data: { nome: `Cliente ${n}`, telefone: "47999990000" },
  });
  const veiculo = await prisma.vehicle.create({
    data: {
      cliente_id: cliente.id,
      placa: `TST${String(n).padStart(4, "0")}`,
      marca: "Fiat",
      modelo: "Uno",
      ano: 2015,
      ...(overrides?.quilometragem_atual !== undefined
        ? { quilometragem_atual: overrides.quilometragem_atual }
        : {}),
    },
  });
  return { cliente, veiculo };
}

export async function criarItemEstoque(
  overrides?: Partial<{
    nome: string;
    quantidade: number;
    quantidade_minima: number;
    valor_final: number;
    valor_entrada: number;
    ativo: boolean;
  }>,
) {
  const n = proximo();
  return prisma.stockItem.create({
    data: {
      nome: overrides?.nome ?? `Peça ${n}`,
      quantidade: overrides?.quantidade ?? 10,
      quantidade_minima: overrides?.quantidade_minima ?? 2,
      valor_final: overrides?.valor_final ?? 50,
      valor_entrada: overrides?.valor_entrada ?? 30,
      ativo: overrides?.ativo ?? true,
    },
  });
}

export async function criarLembrete(
  veiculoId: number,
  overrides?: Partial<{
    nome: string;
    intervalo_dias: number;
    intervalo_km: number;
    proxima_data: Date;
    proximo_km: number;
  }>,
) {
  return prisma.maintenanceReminder.create({
    data: {
      veiculo_id: veiculoId,
      nome: overrides?.nome ?? "Revisão",
      intervalo_dias: overrides?.intervalo_dias ?? 90,
      intervalo_km: overrides?.intervalo_km ?? 5000,
      proxima_data: overrides?.proxima_data ?? new Date(),
      proximo_km: overrides?.proximo_km ?? 5000,
    },
  });
}