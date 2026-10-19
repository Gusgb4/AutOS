import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarProprietario } from "./helpers/auth";
import { criarOrdem } from "./helpers/ordens";

async function pagar(token: string, ordemId: number, valor: number) {
  return request(app)
    .post(`/api/service-orders/${ordemId}/pagamentos`)
    .set("Authorization", `Bearer ${token}`)
    .send({ valor, forma_pagamento: "PIX" });
}

async function buscarOrdem(token: string, ordemId: number) {
  const res = await request(app)
    .get(`/api/service-orders/${ordemId}`)
    .set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  return res.body;
}

async function mudarStatus(token: string, ordemId: number, status: string) {
  return request(app)
    .patch(`/api/service-orders/${ordemId}/status`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status });
}

describe("Pagamento de OS", () => {
  it("pagamento parcial deixa a OS como PARCIAL", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);

    const res = await pagar(token, ordem.id, 100);

    expect(res.status).toBe(201);
    const depois = await buscarOrdem(token, ordem.id);
    expect(depois.status_pagamento).toBe("PARCIAL");
    expect(Number(depois.valor_pago)).toBe(100);
    expect(Number(depois.saldo)).toBe(200);
  });

  it("completar o pagamento deixa a OS como PAGO", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);

    await pagar(token, ordem.id, 100);
    const res = await pagar(token, ordem.id, 200);

    expect(res.status).toBe(201);
    const depois = await buscarOrdem(token, ordem.id);
    expect(depois.status_pagamento).toBe("PAGO");
    expect(Number(depois.saldo)).toBe(0);
  });

  it("pagamento acima do saldo responde 409 e não registra nada", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    await pagar(token, ordem.id, 250);

    const res = await pagar(token, ordem.id, 50.01);

    expect(res.status).toBe(409);
    const pagamentos = await prisma.financialEntry.count({
      where: { ordemId: ordem.id },
    });
    expect(pagamentos).toBe(1);
    const depois = await buscarOrdem(token, ordem.id);
    expect(depois.status_pagamento).toBe("PARCIAL");
  });

  it("pagamento em OS já paga responde 409", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    await pagar(token, ordem.id, 300);

    const res = await pagar(token, ordem.id, 1);

    expect(res.status).toBe(409);
  });

  it.each(["ABERTA", "EM_ANDAMENTO", "CANCELADA"] as const)(
    "pagamento em OS %s responde 409",
    async (status) => {
      const { usuario, token } = await criarProprietario();
      const ordem = await criarOrdem(usuario.id, status, 300);

      const res = await pagar(token, ordem.id, 100);

      expect(res.status).toBe(409);
      const pagamentos = await prisma.financialEntry.count({
        where: { ordemId: ordem.id },
      });
      expect(pagamentos).toBe(0);
    },
  );
});

describe("Estorno de pagamento", () => {
  it("estornar o pagamento que quitou a OS volta para PARCIAL", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    await pagar(token, ordem.id, 100);
    const ultimo = await pagar(token, ordem.id, 200);
    expect((await buscarOrdem(token, ordem.id)).status_pagamento).toBe("PAGO");

    const res = await request(app)
      .patch(`/api/service-orders/${ordem.id}/pagamentos/${ultimo.body.id}/estornar`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.estornado).toBe(true);
    const depois = await buscarOrdem(token, ordem.id);
    expect(depois.status_pagamento).toBe("PARCIAL");
    expect(Number(depois.saldo)).toBe(200);
  });

  it("estornar o único pagamento volta para PENDENTE", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    const pagamento = await pagar(token, ordem.id, 100);

    await request(app)
      .patch(`/api/service-orders/${ordem.id}/pagamentos/${pagamento.body.id}/estornar`)
      .set("Authorization", `Bearer ${token}`);

    const depois = await buscarOrdem(token, ordem.id);
    expect(depois.status_pagamento).toBe("PENDENTE");
    expect(Number(depois.valor_pago)).toBe(0);
  });

  it("estornar o mesmo pagamento duas vezes responde 409", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    const pagamento = await pagar(token, ordem.id, 100);
    const rota = `/api/service-orders/${ordem.id}/pagamentos/${pagamento.body.id}/estornar`;

    await request(app).patch(rota).set("Authorization", `Bearer ${token}`);
    const res = await request(app)
      .patch(rota)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(409);
  });
});

describe("Cancelar OS", () => {
  it("com pagamento ativo responde 409 e a OS continua como estava", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    await pagar(token, ordem.id, 100);
    expect((await mudarStatus(token, ordem.id, "EM_ANDAMENTO")).status).toBe(200);

    const res = await mudarStatus(token, ordem.id, "CANCELADA");

    expect(res.status).toBe(409);
    const depois = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id: ordem.id },
    });
    expect(depois.status).toBe("EM_ANDAMENTO");
  });

  it("depois de estornar os pagamentos a OS pode ser cancelada", async () => {
    const { usuario, token } = await criarProprietario();
    const ordem = await criarOrdem(usuario.id, "FINALIZADA", 300);
    const pagamento = await pagar(token, ordem.id, 100);
    await mudarStatus(token, ordem.id, "EM_ANDAMENTO");
    await request(app)
      .patch(`/api/service-orders/${ordem.id}/pagamentos/${pagamento.body.id}/estornar`)
      .set("Authorization", `Bearer ${token}`);

    const res = await mudarStatus(token, ordem.id, "CANCELADA");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELADA");
  });
});
