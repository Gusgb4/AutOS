import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { criarFuncionario, criarProprietario, gerarToken } from "./helpers/auth";

describe("POST /api/auth/login", () => {
  it("com e-mail e senha certos devolve o token e os dados do usuário", async () => {
    const { usuario, senha } = await criarProprietario();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha });

    expect(res.status).toBe(200);
    expect(res.body.token).toEqual(expect.any(String));
    expect(res.body.user).toEqual({
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: "PROPRIETARIO",
    });
    // O hash da senha nunca sai na resposta
    expect(res.body.user.senha).toBeUndefined();
  });

  it("o token do login dá acesso às rotas autenticadas", async () => {
    const { usuario, senha } = await criarFuncionario();
    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha });

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${login.body.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: usuario.id, perfil: "FUNCIONARIO" });
  });

  it("com a senha errada responde 400 sem token", async () => {
    const { usuario } = await criarProprietario();

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha: "senha_errada" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("E-mail ou senha incorretos");
    expect(res.body.token).toBeUndefined();
  });

  it("com e-mail que não existe responde a mesma mensagem da senha errada", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "ninguem@teste.com", senha: "qualquer" });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe("E-mail ou senha incorretos");
  });

  it("usuário desativado não consegue entrar", async () => {
    const { usuario, senha } = await criarFuncionario({ ativo: false });

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha });

    expect(res.status).toBe(400);
    expect(res.body.token).toBeUndefined();
  });

  it("sem e-mail válido responde 400 com o erro de validação", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "nao-e-email", senha: "123" });

    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.any(Array));
  });
});

describe("Rotas protegidas", () => {
  it("sem token respondem 401", async () => {
    const res = await request(app).get("/api/clients");

    expect(res.status).toBe(401);
  });

  it("com token inválido respondem 401", async () => {
    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", "Bearer token-que-nao-existe");

    expect(res.status).toBe(401);
  });

  it("com token expirado respondem 401", async () => {
    const { usuario } = await criarProprietario();
    const expirado = gerarToken(usuario, -10);

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${expirado}`);

    expect(res.status).toBe(401);
  });

  it("com token válido respondem 200", async () => {
    const { token } = await criarFuncionario();

    const res = await request(app)
      .get("/api/clients")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
  });
});
