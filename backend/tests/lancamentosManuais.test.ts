import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarProprietario } from "./helpers/auth";
import { criarOrdem } from "./helpers/ordens";

async function lancarDespesa(token: string, valor = 150) {
  const res = await request(app)
    .post("/api/financial")
    .set("Authorization", `Bearer ${token}`)
    .send({
      tipo: "DESPESA",
      descricao: "Conta de luz",
      valor,
      categoria: "ENERGIA",
    });
  expect(res.status).toBe(201);
  return res.body;
}

async function estornar(token: string, id: string) {
  return request(app)
    .patch(`/api/financial/${id}/estornar`)
    .set("Authorization", `Bearer ${token}`);
}

describe("Estorno de lançamento manual", () => {
  it("estorna, tira da lista padrão e continua aparecendo com estornados=true", async () => {
    const { token } = await criarProprietario();
    const lancamento = await lancarDespesa(token);

    const res = await estornar(token, lancamento.id);

    expect(res.status).toBe(200);
    expect(res.body.estornado).toBe(true);

    const ativos = await request(app)
      .get("/api/financial")
      .set("Authorization", `Bearer ${token}`);
    expect(ativos.body.map((l: { id: string }) => l.id)).not.toContain(
      lancamento.id,
    );

    // O estorno não apaga: o lançamento segue no histórico
    const todos = await request(app)
      .get("/api/financial?estornados=true")
      .set("Authorization", `Bearer ${token}`);
    expect(todos.body.map((l: { id: string }) => l.id)).toContain(
      lancamento.id,
    );
  });

  it("recusa estornar pagamento de OS por aqui (409)", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    const pagamento = await request(app)
      .post(`/api/service-orders/${ordem.id}/pagamentos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ valor: 100, forma_pagamento: "PIX" });
    expect(pagamento.status).toBe(201);

    const res = await estornar(token, pagamento.body.id);

    expect(res.status).toBe(409);
    const noBanco = await prisma.financialEntry.findUniqueOrThrow({
      where: { id: pagamento.body.id },
    });
    expect(noBanco.estornado).toBe(false);
  });

  it("recusa estornar o mesmo lançamento duas vezes (409)", async () => {
    const { token } = await criarProprietario();
    const lancamento = await lancarDespesa(token);
    await estornar(token, lancamento.id);

    const res = await estornar(token, lancamento.id);

    expect(res.status).toBe(409);
  });
});
