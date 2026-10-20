import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarFuncionario, criarProprietario } from "./helpers/auth";

// Rotas de consulta que são só do proprietário
const ROTAS_DO_PROPRIETARIO = [
  "/api/financial",
  "/api/reports/inventory?inicio=2026-10-01&fim=2026-10-31",
  "/api/reports/sales?inicio=2026-10-01&fim=2026-10-31",
  "/api/reports/financial-summary?inicio=2026-10-01&fim=2026-10-31",
  "/api/reports/client-activity?inicio=2026-10-01&fim=2026-10-31",
];

describe("Funcionário", () => {
  it.each(ROTAS_DO_PROPRIETARIO)("GET %s responde 403", async (rota) => {
    const { token } = await criarFuncionario();

    const res = await request(app)
      .get(rota)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
  });

  it("PATCH /api/users/:id/deactivate responde 403 e não desativa ninguém", async () => {
    const { token } = await criarFuncionario();
    const { usuario: colega } = await criarFuncionario();

    const res = await request(app)
      .patch(`/api/users/${colega.id}/deactivate`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    const depois = await prisma.user.findUniqueOrThrow({
      where: { id: colega.id },
    });
    expect(depois.ativo).toBe(true);
  });
});

describe("Proprietário", () => {
  it.each(ROTAS_DO_PROPRIETARIO)("GET %s responde 200", async (rota) => {
    const { token } = await criarProprietario();

    const res = await request(app)
      .get(rota)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });

  it("PATCH /api/users/:id/deactivate responde 200 e desativa o funcionário", async () => {
    const { token } = await criarProprietario();
    const { usuario: funcionario } = await criarFuncionario();

    const res = await request(app)
      .patch(`/api/users/${funcionario.id}/deactivate`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const depois = await prisma.user.findUniqueOrThrow({
      where: { id: funcionario.id },
    });
    expect(depois.ativo).toBe(false);
  });
});
