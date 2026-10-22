import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarProprietario } from "./helpers/auth";
import { criarClienteComVeiculo, criarLembrete } from "./helpers/fixtures";

const OLEO = { nome: "Troca de óleo", intervalo_dias: 180, intervalo_km: 10000 };
const CORREIA = { nome: "Correia dentada", intervalo_dias: 1460, intervalo_km: 60000 };

async function cadastrarVeiculo(token: string, clienteId: number, extra = {}) {
  return request(app)
    .post("/api/vehicles")
    .set("Authorization", `Bearer ${token}`)
    .send({
      cliente_id: clienteId,
      placa: `LMB${Math.floor(Math.random() * 9000 + 1000)}`,
      marca: "Fiat",
      modelo: "Uno",
      ano: 2015,
      quilometragem_atual: 40000,
      ...extra,
    });
}

async function editarVeiculo(token: string, id: number, dados: object) {
  return request(app)
    .put(`/api/vehicles/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send(dados);
}

describe("Lembretes no cadastro do veículo", () => {
  it("cadastra o veículo com vários lembretes, cada um com a sua agenda", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();

    const res = await cadastrarVeiculo(token, cliente.id, {
      lembretes: [OLEO, CORREIA],
    });

    expect(res.status).toBe(201);
    expect(res.body.lembretes).toHaveLength(2);
    expect(res.body.lembretes.map((l: { nome: string }) => l.nome)).toEqual([
      "Troca de óleo",
      "Correia dentada",
    ]);
    // A contagem parte da km do veículo
    expect(res.body.lembretes[0].proximo_km).toBe(50000);
    expect(res.body.lembretes[1].proximo_km).toBe(100000);
  });

  it("editar só o nome não zera a contagem; mudar o intervalo recalcula", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    const criado = await cadastrarVeiculo(token, cliente.id, { lembretes: [OLEO, CORREIA] });
    const [oleo, correia] = criado.body.lembretes;
    // Simula uma agenda antiga, pra ver se ela muda ou não
    await prisma.maintenanceReminder.updateMany({
      where: { veiculo_id: criado.body.id },
      data: { proximo_km: 12345 },
    });

    const res = await editarVeiculo(token, criado.body.id, {
      lembretes: [
        { ...OLEO, id: oleo.id, nome: "Óleo e filtro" },
        { ...CORREIA, id: correia.id, intervalo_km: 50000 },
      ],
    });

    expect(res.status).toBe(200);
    const [oleoDepois, correiaDepois] = res.body.lembretes;
    expect(oleoDepois.nome).toBe("Óleo e filtro");
    expect(oleoDepois.proximo_km).toBe(12345);
    expect(correiaDepois.proximo_km).toBe(90000);
  });

  it("a lista enviada substitui a anterior: o que saiu é apagado e o novo é criado", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    const criado = await cadastrarVeiculo(token, cliente.id, { lembretes: [OLEO, CORREIA] });
    const [oleo] = criado.body.lembretes;

    const res = await editarVeiculo(token, criado.body.id, {
      lembretes: [
        { ...OLEO, id: oleo.id },
        { nome: "Filtro de ar", intervalo_dias: 365, intervalo_km: 15000 },
      ],
    });

    expect(res.status).toBe(200);
    expect(res.body.lembretes.map((l: { nome: string }) => l.nome)).toEqual([
      "Troca de óleo",
      "Filtro de ar",
    ]);
    expect(
      await prisma.maintenanceReminder.count({ where: { veiculo_id: criado.body.id } }),
    ).toBe(2);
  });

  it("editar o veículo sem mandar lembretes não mexe neles; lista vazia apaga todos", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();
    const criado = await cadastrarVeiculo(token, cliente.id, { lembretes: [OLEO] });

    await editarVeiculo(token, criado.body.id, { cor: "Prata" });
    expect(
      await prisma.maintenanceReminder.count({ where: { veiculo_id: criado.body.id } }),
    ).toBe(1);

    await editarVeiculo(token, criado.body.id, { lembretes: [] });
    expect(
      await prisma.maintenanceReminder.count({ where: { veiculo_id: criado.body.id } }),
    ).toBe(0);
  });

  it("recusa lembrete sem nome ou sem intervalo (400)", async () => {
    const { token } = await criarProprietario();
    const { cliente } = await criarClienteComVeiculo();

    const semNome = await cadastrarVeiculo(token, cliente.id, {
      lembretes: [{ ...OLEO, nome: "  " }],
    });
    const semKm = await cadastrarVeiculo(token, cliente.id, {
      lembretes: [{ nome: "Óleo", intervalo_dias: 180 }],
    });

    expect(semNome.status).toBe(400);
    expect(semKm.status).toBe(400);
  });

  it("recusa editar lembrete de outro veículo (400)", async () => {
    const { token } = await criarProprietario();
    const { cliente, veiculo: outro } = await criarClienteComVeiculo();
    const deOutroCarro = await criarLembrete(outro.id);
    const criado = await cadastrarVeiculo(token, cliente.id);

    const res = await editarVeiculo(token, criado.body.id, {
      lembretes: [{ ...OLEO, id: deOutroCarro.id }],
    });

    expect(res.status).toBe(400);
  });
});

describe("Notificações de lembretes", () => {
  it("cada lembrete vencido vira uma notificação com o nome dele", async () => {
    const { token } = await criarProprietario();
    const { veiculo } = await criarClienteComVeiculo({ quilometragem_atual: 50000 });
    await criarLembrete(veiculo.id, {
      nome: "Troca de óleo",
      proxima_data: new Date("2020-01-01"),
      proximo_km: 60000,
    });
    await criarLembrete(veiculo.id, {
      nome: "Correia dentada",
      proxima_data: new Date("2099-01-01"),
      proximo_km: 49000,
    });
    // Longe de vencer: não aparece
    await criarLembrete(veiculo.id, {
      nome: "Filtro de ar",
      proxima_data: new Date("2099-01-01"),
      proximo_km: 90000,
    });

    const res = await request(app)
      .get("/api/notificacoes")
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    const revisoes = res.body.notificacoes.filter(
      (n: { tipo: string }) => n.tipo === "REVISAO_VENCIDA",
    );
    expect(revisoes.map((n: { revisao: { lembrete: string } }) => n.revisao.lembrete).sort()).toEqual([
      "Correia dentada",
      "Troca de óleo",
    ]);
    expect(revisoes[0].titulo).toContain("·");
  });
});
