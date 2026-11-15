import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarFuncionario, criarProprietario } from "./helpers/auth";
import { criarOrdem } from "./helpers/ordens";

const PECA = { nome: "Sensor de rotação", valor_final: 180, valor_entrada: 120, quantidade: 1 };

async function pecaRapida(token: string, ordemId: number, dados: object) {
  return request(app)
    .post(`/api/service-orders/${ordemId}/parts/nova`)
    .set("Authorization", `Bearer ${token}`)
    .send(dados);
}

describe("Peça rápida na OS", () => {
  it("cadastra a peça no estoque (com zero) e já a coloca na OS", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "ABERTA", 0);

    const res = await pecaRapida(token, ordem.id, { ...PECA, quantidade: 2 });

    expect(res.status).toBe(201);
    const item = await prisma.stockItem.findUniqueOrThrow({
      where: { id: res.body.item_estoque_id },
    });
    expect(item).toMatchObject({ nome: "Sensor de rotação", quantidade: 0 });
    expect(Number(item.valor_final)).toBe(180);
    expect(Number(item.valor_entrada)).toBe(120);

    const parte = await prisma.serviceOrderPart.findFirstOrThrow({
      where: { ordem_id: ordem.id, item_estoque_id: item.id },
    });
    expect(parte.quantidade).toBe(2);
    expect(Number(res.body.ordem.valor_total)).toBe(360);
  });

  it("funcionário não pode (403) e nada é cadastrado", async () => {
    const { usuario, token } = await criarFuncionario();
    const ordem = await criarOrdem(usuario.id, "ABERTA", 0);

    const res = await pecaRapida(token, ordem.id, PECA);

    expect(res.status).toBe(403);
    expect(await prisma.stockItem.count({ where: { nome: PECA.nome } })).toBe(0);
  });

  it("OS finalizada recusa (409) e a peça não fica no estoque", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);

    const res = await pecaRapida(token, ordem.id, PECA);

    expect(res.status).toBe(409);
    expect(await prisma.stockItem.count({ where: { nome: PECA.nome } })).toBe(0);
  });

  it("recusa sem nome, sem preço ou com quantidade zero (400)", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "ABERTA", 0);

    for (const dados of [
      { ...PECA, nome: " " },
      { ...PECA, valor_final: 0 },
      { ...PECA, quantidade: 0 },
    ]) {
      const res = await pecaRapida(token, ordem.id, dados);
      expect(res.status).toBe(400);
    }
  });
});
