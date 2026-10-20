import type { StatusOrdemServico } from "@prisma/client";
import { prisma } from "../../src/config/prisma";

let contador = 0;

export async function criarOrdem(
  mecanicoId: number,
  status: StatusOrdemServico,
  valorTotal = 300,
) {
  contador += 1;

  const cliente = await prisma.client.create({
    data: { nome: `Cliente ${contador}`, telefone: "47999990000" },
  });
  const veiculo = await prisma.vehicle.create({
    data: {
      cliente_id: cliente.id,
      placa: `TST${String(contador).padStart(4, "0")}`,
      marca: "Fiat",
      modelo: "Uno",
      ano: 2015,
    },
  });

  return prisma.serviceOrder.create({
    data: {
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanicoId,
      status,
      valor_total: valorTotal,
      finalizada_em: status === "FINALIZADA" ? new Date() : null,
    },
  });
}
