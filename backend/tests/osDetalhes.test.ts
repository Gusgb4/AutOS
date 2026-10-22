import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarProprietario } from "./helpers/auth";
import { criarClienteComVeiculo } from "./helpers/fixtures";

async function abrirOrdem(token: string, mecanicoId: number, extra = {}) {
  const { cliente, veiculo } = await criarClienteComVeiculo();
  const res = await request(app)
    .post("/api/service-orders")
    .set("Authorization", `Bearer ${token}`)
    .send({
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanicoId,
      ...extra,
    });
  expect(res.status).toBe(201);
  return res.body;
}

async function salvarDetalhes(token: string, ordemId: number, dados: object) {
  return request(app)
    .patch(`/api/service-orders/${ordemId}/detalhes`)
    .set("Authorization", `Bearer ${token}`)
    .send(dados);
}

describe("Detalhes da OS (reclamação, previsão e informações ao cliente)", () => {
  it("abre a OS já com a reclamação e a previsão de entrega", async () => {
    const { usuario, token } = await criarProprietario();

    const ordem = await abrirOrdem(token, usuario.id, {
      reclamacao: "Barulho ao frear",
      previsao_entrega: "2026-10-25",
    });

    expect(ordem.reclamacao).toBe("Barulho ao frear");
    // Meio-dia de Brasília: continua dia 25 em qualquer fuso do Brasil
    expect(ordem.previsao_entrega).toBe("2026-10-25T15:00:00.000Z");
  });

  it("muda só os campos enviados", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await abrirOrdem(token, usuario.id, {
      reclamacao: "Barulho ao frear",
      observacoes: "Trocar pneus em breve",
    });

    const res = await salvarDetalhes(token, ordem.id, {
      previsao_entrega: "2026-10-30",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      reclamacao: "Barulho ao frear",
      observacoes: "Trocar pneus em breve",
      previsao_entrega: "2026-10-30T15:00:00.000Z",
    });
  });

  it("texto ou data vazios apagam o campo", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await abrirOrdem(token, usuario.id, {
      reclamacao: "Barulho ao frear",
      observacoes: "Trocar pneus em breve",
      previsao_entrega: "2026-10-25",
    });

    const res = await salvarDetalhes(token, ordem.id, {
      reclamacao: "",
      observacoes: "  ",
      previsao_entrega: "",
    });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      reclamacao: null,
      observacoes: null,
      previsao_entrega: null,
    });
  });

  it("recusa data em formato errado (400)", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await abrirOrdem(token, usuario.id);

    const res = await salvarDetalhes(token, ordem.id, {
      previsao_entrega: "25/10/2026",
    });

    expect(res.status).toBe(400);
  });
});

describe("Cor do veículo", () => {
  it("cadastra com cor, edita e apaga com texto vazio", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    const auth = { Authorization: `Bearer ${token}` };

    const criado = await request(app).post("/api/vehicles").set(auth).send({
      cliente_id: cliente.id,
      placa: "COR1234",
      marca: "VW",
      modelo: "Gol",
      ano: 2012,
      cor: "Prata",
    });
    expect(criado.status).toBe(201);
    expect(criado.body.cor).toBe("Prata");

    await request(app)
      .put(`/api/vehicles/${criado.body.id}`)
      .set(auth)
      .send({ cor: "" });

    const depois = await prisma.vehicle.findUniqueOrThrow({
      where: { id: criado.body.id },
    });
    expect(depois.cor).toBeNull();
  });
});
