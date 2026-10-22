import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarProprietario } from "./helpers/auth";
import { criarClienteComVeiculo } from "./helpers/fixtures";
import { criarOrdem } from "./helpers/ordens";

async function cadastrar(token: string, clienteId: number, placa: string, extra = {}) {
  return request(app)
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${token}`)
    .send({
      cliente_id: clienteId,
      placa,
      marca: "VW",
      modelo: "Gol",
      ano: 2012,
      ...extra,
    });
}

describe("Placa do veículo", () => {
  it("guarda a placa em maiúsculas", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();

    const res = await cadastrar(token, cliente.id, " arx2020 ");

    expect(res.status).toBe(201);
    expect(res.body.placa).toBe("ARX2020");
  });

  it("placa de veículo ativo responde 409 com mensagem clara", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    await cadastrar(token, cliente.id, "ARX2020");

    const res = await cadastrar(token, cliente.id, "arx2020");

    expect(res.status).toBe(409);
    expect(res.body.erro).toBe("Já existe um veículo com essa placa.");
  });

  it("placa de veículo excluído (arquivado) reaproveita o veículo, mesmo para outro cliente", async () => {
    const { usuario, token } = await criarProprietario();
    const { cliente: antigoDono } = await criarClienteComVeiculo();
    const { cliente: novoDono } = await criarClienteComVeiculo();
    const primeiro = await cadastrar(token, antigoDono.id, "ARX2020", {
      lembretes: [{ nome: "Troca de óleo", intervalo_dias: 180, intervalo_km: 10000 }],
    });
    // Uma OS antiga do antigo dono
    const ordem = await criarOrdem(usuario.id, "FINALIZADA");
    await prisma.serviceOrder.update({
      where: { id: ordem.id },
      data: { veiculo_id: primeiro.body.id, cliente_id: antigoDono.id },
    });
    await request(app)
      .patch(`/api/vehicles/${primeiro.body.id}/archive`)
      .set("Authorization", `Bearer ${token}`);

    const res = await cadastrar(token, novoDono.id, "ARX2020", {
      marca: "Fiat",
      modelo: "Palio",
      quilometragem_atual: 80000,
    });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe(primeiro.body.id);
    expect(res.body).toMatchObject({
      cliente_id: novoDono.id,
      marca: "Fiat",
      modelo: "Palio",
      quilometragem_atual: 80000,
      ativo: true,
    });
    // Os lembretes antigos não vêm junto: o cadastro novo manda os seus
    expect(res.body.lembretes).toHaveLength(0);
    // A OS antiga continua com o cliente da época
    const ordemDepois = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id: ordem.id },
    });
    expect(ordemDepois.cliente_id).toBe(antigoDono.id);
  });
});
