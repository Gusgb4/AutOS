import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarFuncionario, criarProprietario } from "./helpers/auth";

describe("Usuário desativado", () => {
  it("com token emitido antes da desativação recebe 401", async () => {
    const { token: tokenDono } = await criarProprietario();
    const { usuario, token } = await criarFuncionario();
    const antes = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);
    expect(antes.status).toBe(200);

    await request(app)
      .patch(`/api/users/${usuario.id}/deactivate`)
      .set("Authorization", `Bearer ${tokenDono}`);
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it("recebe 401 também em /api/auth/me", async () => {
    const { token } = await criarFuncionario({ ativo: false });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(401);
  });

  it("volta a ter acesso depois de reativado", async () => {
    const { token: tokenDono } = await criarProprietario();
    const { usuario, token } = await criarFuncionario({ ativo: false });

    await request(app)
      .patch(`/api/users/${usuario.id}/activate`)
      .set("Authorization", `Bearer ${tokenDono}`);
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});

describe("Troca de senha obrigatória", () => {
  it("com trocar_senha a API responde 403 TROCAR_SENHA", async () => {
    const { token } = await criarFuncionario({ trocar_senha: true });

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe("TROCAR_SENHA");
  });

  it("com trocar_senha o /api/auth/me continua liberado", async () => {
    const { usuario, token } = await criarFuncionario({ trocar_senha: true });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: usuario.id, trocar_senha: true });
  });

  it("o login avisa que a senha precisa ser trocada", async () => {
    const { usuario, senha } = await criarFuncionario({ trocar_senha: true });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha });

    expect(res.status).toBe(200);
    expect(res.body.user.trocar_senha).toBe(true);
  });

  it("depois da troca o acesso fica liberado com a nova senha", async () => {
    const { usuario, senha, token } = await criarFuncionario({
      trocar_senha: true,
    });

    const troca = await request(app)
      .patch("/api/auth/senha")
      .set("Authorization", `Bearer ${token}`)
      .send({ senha_atual: senha, nova_senha: "novaSenha123" });
    expect(troca.status).toBe(200);

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);

    const depois = await prisma.user.findUniqueOrThrow({
      where: { id: usuario.id },
    });
    expect(depois.trocar_senha).toBe(false);

    const loginNovo = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha: "novaSenha123" });
    expect(loginNovo.status).toBe(200);
    expect(loginNovo.body.user.trocar_senha).toBe(false);

    const loginAntigo = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha });
    expect(loginAntigo.status).toBe(400);
  });

  it("com a senha atual errada responde 400 e o bloqueio continua", async () => {
    const { token } = await criarFuncionario({ trocar_senha: true });

    const troca = await request(app)
      .patch("/api/auth/senha")
      .set("Authorization", `Bearer ${token}`)
      .send({ senha_atual: "senha_errada", nova_senha: "novaSenha123" });
    expect(troca.status).toBe(400);

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
    expect(res.body.codigo).toBe("TROCAR_SENHA");
  });
});

describe("POST /api/auth/register", () => {
  it("não existe mais e não cria usuário", async () => {
    const res = await request(app).post("/api/auth/register").send({
      nome: "Intruso",
      email: "intruso@teste.com",
      senha: "123456",
      perfil: "PROPRIETARIO",
    });

    expect(res.status).toBe(404);
    const criado = await prisma.user.findUnique({
      where: { email: "intruso@teste.com" },
    });
    expect(criado).toBeNull();
  });
});
