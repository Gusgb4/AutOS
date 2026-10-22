import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarProprietario } from "./helpers/auth";
import { criarOrdem } from "./helpers/ordens";

// OS finalizada numa data escolhida (meio-dia de Brasília)
async function ordemFinalizadaEm(mecanicoId: number, dia: string, valor: number) {
  const ordem = await criarOrdem(mecanicoId, "FINALIZADA", valor);
  return prisma.serviceOrder.update({
    where: { id: ordem.id },
    data: { finalizada_em: new Date(`${dia}T12:00:00-03:00`) },
  });
}

async function vendas(token: string, query: Record<string, string>) {
  return request(app)
    .get("/api/reports/sales")
    .query(query)
    .set("Authorization", `Bearer ${token}`);
}

describe("Comparação nos relatórios", () => {
  it("sem comparação escolhida, compara com o período anterior de mesma duração", async () => {
    const { token } = await criarProprietario();

    const res = await vendas(token, { inicio: "2026-10-01", fim: "2026-10-10" });

    expect(res.status).toBe(200);
    expect(res.body.periodo_anterior).toEqual({
      inicio: "2026-09-21",
      fim: "2026-09-30",
    });
  });

  it("com comparação escolhida, usa as datas informadas", async () => {
    const { usuario, token } = await criarProprietario();
    await ordemFinalizadaEm(usuario.id, "2026-10-05", 300);
    await ordemFinalizadaEm(usuario.id, "2025-10-05", 100);

    const res = await vendas(token, {
      inicio: "2026-10-01",
      fim: "2026-10-31",
      comparar_inicio: "2025-10-01",
      comparar_fim: "2025-10-31",
    });

    expect(res.status).toBe(200);
    expect(res.body.periodo_anterior).toEqual({
      inicio: "2025-10-01",
      fim: "2025-10-31",
    });
    expect(res.body.atual.total).toBe(300);
    expect(res.body.anterior.total).toBe(100);
    expect(res.body.variacao.total).toBe(200);
  });

  it("a comparação vale nos quatro relatórios", async () => {
    const { token } = await criarProprietario();
    const query = {
      inicio: "2026-10-01",
      fim: "2026-10-31",
      comparar_inicio: "2025-10-01",
      comparar_fim: "2025-10-31",
    };

    for (const rota of ["financial-summary", "client-activity"]) {
      const res = await request(app)
        .get(`/api/reports/${rota}`)
        .query(query)
        .set("Authorization", `Bearer ${token}`);
      expect(res.status).toBe(200);
      expect(res.body.periodo_anterior.inicio).toBe("2025-10-01");
    }

    const inventario = await request(app)
      .get("/api/reports/inventory")
      .query(query)
      .set("Authorization", `Bearer ${token}`);
    expect(inventario.status).toBe(200);
    expect(inventario.body.consumo.periodo_anterior.inicio).toBe("2025-10-01");
  });

  it("recusa comparação com só uma das datas (400)", async () => {
    const { token } = await criarProprietario();

    const res = await vendas(token, {
      inicio: "2026-10-01",
      fim: "2026-10-31",
      comparar_inicio: "2025-10-01",
    });

    expect(res.status).toBe(400);
  });

  it("recusa comparação com a data inicial depois da final (400)", async () => {
    const { token } = await criarProprietario();

    const res = await vendas(token, {
      inicio: "2026-10-01",
      fim: "2026-10-31",
      comparar_inicio: "2025-10-31",
      comparar_fim: "2025-10-01",
    });

    expect(res.status).toBe(400);
  });
});
