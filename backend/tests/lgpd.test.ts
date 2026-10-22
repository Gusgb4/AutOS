import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { limparAcessosAntigos } from "../src/services/accessLog.service";
import { criarFuncionario, criarProprietario } from "./helpers/auth";
import { criarClienteComVeiculo } from "./helpers/fixtures";

async function anonimizar(token: string, clienteId: number) {
  return request(app)
    .post(`/api/clients/${clienteId}/anonimizar`)
    .set("Authorization", `Bearer ${token}`);
}

// OS direto no banco, ligada ao cliente e ao veículo do fixture
async function criarOrdemDoCliente(
  mecanicoId: number,
  clienteId: number,
  veiculoId: number,
  status: "ABERTA" | "FINALIZADA",
  valorTotal = 300,
) {
  return prisma.serviceOrder.create({
    data: {
      cliente_id: clienteId,
      veiculo_id: veiculoId,
      mecanico_id: mecanicoId,
      status,
      valor_total: valorTotal,
      finalizada_em: status === "FINALIZADA" ? new Date() : null,
    },
  });
}

describe("Anonimização de cliente (LGPD)", () => {
  it("apaga os dados pessoais e a placa, e mantém as OS", async () => {
    const { usuario, token } = await criarProprietario();
    const { cliente, veiculo } = await criarClienteComVeiculo();
    await prisma.client.update({
      where: { id: cliente.id },
      data: {
        documento: "123.456.789-00",
        email: "joao@exemplo.com",
        endereco: "Rua X, 50",
      },
    });
    await prisma.maintenanceReminder.create({
      data: {
        veiculo_id: veiculo.id,
        nome: "Troca de óleo",
        intervalo_dias: 180,
        intervalo_km: 10000,
        proxima_data: new Date(),
        proximo_km: 10000,
      },
    });
    // OS finalizada e já paga: não trava a anonimização
    const ordem = await criarOrdemDoCliente(
      usuario.id,
      cliente.id,
      veiculo.id,
      "FINALIZADA",
    );
    await request(app)
      .post(`/api/service-orders/${ordem.id}/pagamentos`)
      .set("Authorization", `Bearer ${token}`)
      .send({ valor: 300, forma_pagamento: "PIX" });

    const res = await anonimizar(token, cliente.id);

    expect(res.status).toBe(200);
    const depois = await prisma.client.findUniqueOrThrow({
      where: { id: cliente.id },
    });
    expect(depois).toMatchObject({
      nome: "Cliente removido",
      telefone: "",
      documento: null,
      email: null,
      endereco: null,
      ativo: false,
    });
    expect(depois.anonimizado_em).not.toBeNull();

    const veiculoDepois = await prisma.vehicle.findUniqueOrThrow({
      where: { id: veiculo.id },
    });
    expect(veiculoDepois.placa).toBe(`REMOVIDA-${veiculo.id}`);
    // Marca, modelo e ano não identificam ninguém e ficam pro histórico
    expect(veiculoDepois).toMatchObject({ marca: "Fiat", modelo: "Uno" });
    expect(
      await prisma.maintenanceReminder.count({
        where: { veiculo_id: veiculo.id },
      }),
    ).toBe(0);

    // A OS e o pagamento continuam lá
    expect(
      await prisma.serviceOrder.count({ where: { id: ordem.id } }),
    ).toBe(1);
    expect(
      await prisma.financialEntry.count({ where: { ordemId: ordem.id } }),
    ).toBe(1);
  });

  it("some das listas de clientes, ativos e arquivados", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    await anonimizar(token, cliente.id);

    for (const url of ["/api/clients", "/api/clients?arquivados=true"]) {
      const res = await request(app)
        .get(url)
        .set("Authorization", `Bearer ${token}`);
      expect(res.body.map((c: { id: number }) => c.id)).not.toContain(
        cliente.id,
      );
    }
  });

  it("depois de anonimizado não dá pra editar, desarquivar nem cadastrar veículo", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    await anonimizar(token, cliente.id);
    const auth = { Authorization: `Bearer ${token}` };

    const editar = await request(app)
      .put(`/api/clients/${cliente.id}`)
      .set(auth)
      .send({ nome: "João de volta" });
    const desarquivar = await request(app)
      .patch(`/api/clients/${cliente.id}/unarchive`)
      .set(auth);
    const novoVeiculo = await request(app)
      .post("/api/vehicles")
      .set(auth)
      .send({
        cliente_id: cliente.id,
        placa: "NEW1234",
        marca: "VW",
        modelo: "Gol",
        ano: 2010,
      });

    expect(editar.status).toBe(409);
    expect(desarquivar.status).toBe(409);
    expect(novoVeiculo.status).toBe(409);
    const depois = await prisma.client.findUniqueOrThrow({
      where: { id: cliente.id },
    });
    expect(depois.nome).toBe("Cliente removido");
  });

  it("recusa com OS em aberto (409) e não mexe em nada", async () => {
    const { usuario, token } = await criarProprietario();
    const { cliente, veiculo } = await criarClienteComVeiculo();
    await criarOrdemDoCliente(usuario.id, cliente.id, veiculo.id, "ABERTA");

    const res = await anonimizar(token, cliente.id);

    expect(res.status).toBe(409);
    const depois = await prisma.client.findUniqueOrThrow({
      where: { id: cliente.id },
    });
    expect(depois.nome).toBe(cliente.nome);
    expect(depois.anonimizado_em).toBeNull();
  });

  it("recusa com valor a receber (409)", async () => {
    const { usuario, token } = await criarProprietario();
    const { cliente, veiculo } = await criarClienteComVeiculo();
    await criarOrdemDoCliente(
      usuario.id,
      cliente.id,
      veiculo.id,
      "FINALIZADA",
    );

    const res = await anonimizar(token, cliente.id);

    expect(res.status).toBe(409);
  });

  it("recusa anonimizar duas vezes (409)", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    await anonimizar(token, cliente.id);

    const res = await anonimizar(token, cliente.id);

    expect(res.status).toBe(409);
  });

  it("funcionário não pode anonimizar (403)", async () => {
    const { token } = await criarFuncionario();
    const { cliente } = await criarClienteComVeiculo();

    const res = await anonimizar(token, cliente.id);

    expect(res.status).toBe(403);
  });
});

describe("Registro de acesso (Marco Civil)", () => {
  it("grava o login certo e o errado, com IP", async () => {
    const { usuario, senha } = await criarProprietario();

    await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha });
    await request(app)
      .post("/api/auth/login")
      .send({ email: usuario.email, senha: "senha_errada" });
    await request(app)
      .post("/api/auth/login")
      .send({ email: "ninguem@teste.com", senha: "qualquer" });

    const logs = await prisma.accessLog.findMany({ orderBy: { id: "asc" } });
    expect(logs.map((l) => [l.evento, l.email, l.usuario_id])).toEqual([
      ["LOGIN_OK", usuario.email, usuario.id],
      ["LOGIN_FALHA", usuario.email, usuario.id],
      ["LOGIN_FALHA", "ninguem@teste.com", null],
    ]);
    expect(logs.every((l) => l.ip.length > 0)).toBe(true);
  });

  it("apaga só os registros com mais de 6 meses", async () => {
    const agora = new Date("2026-10-22T12:00:00Z");
    await prisma.accessLog.createMany({
      data: [
        {
          evento: "LOGIN_OK",
          email: "velho@teste.com",
          ip: "1.1.1.1",
          created_at: new Date("2026-04-21T12:00:00Z"),
        },
        {
          evento: "LOGIN_OK",
          email: "recente@teste.com",
          ip: "1.1.1.1",
          created_at: new Date("2026-04-23T12:00:00Z"),
        },
      ],
    });

    await limparAcessosAntigos(agora);

    const restantes = await prisma.accessLog.findMany();
    expect(restantes.map((l) => l.email)).toEqual(["recente@teste.com"]);
  });
});
