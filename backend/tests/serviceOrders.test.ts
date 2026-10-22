import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "../src/app";
import { prisma } from "../src/config/prisma";
import { criarFuncionario, criarProprietario } from "./helpers/auth";
import { criarOrdem } from "./helpers/ordens";
import {
  criarClienteComVeiculo,
  criarItemEstoque,
  criarLembrete,
} from "./helpers/fixtures";

// Aceita { erro } ou { error } até confirmarmos qual o middleware usa
function mensagemErro(res: request.Response) {
  return res.body.erro ?? res.body.error;
}

async function abrirOrdem(token: string, overrides?: {
  quilometragem_registrada?: number;
  veiculoId?: number;
  clienteId?: number;
}) {
  const mecanico = await criarFuncionario();
  const { cliente, veiculo } =
    overrides?.veiculoId && overrides?.clienteId
      ? { cliente: { id: overrides.clienteId }, veiculo: { id: overrides.veiculoId } }
      : await criarClienteComVeiculo();

  const res = await request(app)
    .post("/api/service-orders")
    .set("Authorization", `Bearer ${token}`)
    .send({
      cliente_id: cliente.id,
      veiculo_id: veiculo.id,
      mecanico_id: mecanico.usuario.id,
      ...(overrides?.quilometragem_registrada !== undefined
        ? { quilometragem_registrada: overrides.quilometragem_registrada }
        : {}),
    });

  return { res, cliente, veiculo, mecanico };
}

describe("Estoque na OS", () => {
  it("adicionar peça baixa a quantidade do estoque e soma no valor total", async () => {
    const { token } = await criarProprietario();
    const item = await criarItemEstoque({ quantidade: 10, valor_final: 50 });
    const { res: osRes } = await abrirOrdem(token);

    const res = await request(app)
      .post(`/api/service-orders/${osRes.body.id}/parts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ item_estoque_id: item.id, quantidade: 3 });

    expect(res.status).toBe(201);
    expect(res.body.estoque_restante).toBe(7);
    expect(res.body.ordem.pecas).toHaveLength(1);
    expect(Number(res.body.ordem.valor_total)).toBe(150);

    const itemAtualizado = await prisma.stockItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(itemAtualizado.quantidade).toBe(7);
  });

  it("peça sem estoque suficiente dá erro e não altera a quantidade", async () => {
    const { token } = await criarProprietario();
    const item = await criarItemEstoque({ quantidade: 2 });
    const { res: osRes } = await abrirOrdem(token);

    const res = await request(app)
      .post(`/api/service-orders/${osRes.body.id}/parts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ item_estoque_id: item.id, quantidade: 5 });

    expect(res.status).toBe(409);
    expect(mensagemErro(res)).toMatch(/Estoque insuficiente/i);

    const itemAtualizado = await prisma.stockItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(itemAtualizado.quantidade).toBe(2);
  });

  it("item arquivado não pode ser usado em nova peça", async () => {
    const { token } = await criarProprietario();
    const item = await criarItemEstoque({ ativo: false, quantidade: 10 });
    const { res: osRes } = await abrirOrdem(token);

    const res = await request(app)
      .post(`/api/service-orders/${osRes.body.id}/parts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ item_estoque_id: item.id, quantidade: 1 });

    expect(res.status).toBe(409);
    expect(mensagemErro(res)).toMatch(/arquivado/i);
  });

  it("remover peça devolve a quantidade ao estoque", async () => {
    const { token } = await criarProprietario();
    const item = await criarItemEstoque({ quantidade: 10 });
    const { res: osRes } = await abrirOrdem(token);

    const add = await request(app)
      .post(`/api/service-orders/${osRes.body.id}/parts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ item_estoque_id: item.id, quantidade: 4 });
    const partId = add.body.ordem.pecas[0].id;

    const res = await request(app)
      .delete(`/api/service-orders/${osRes.body.id}/parts/${partId}`)
      .set("Authorization", `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.pecas).toHaveLength(0);
    expect(Number(res.body.valor_total)).toBe(0);

    const itemAtualizado = await prisma.stockItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(itemAtualizado.quantidade).toBe(10);
  });

  it("cancelar a OS devolve ao estoque todas as peças usadas", async () => {
    const { token } = await criarProprietario();
    const item = await criarItemEstoque({ quantidade: 10 });
    const { res: osRes } = await abrirOrdem(token);

    await request(app)
      .post(`/api/service-orders/${osRes.body.id}/parts`)
      .set("Authorization", `Bearer ${token}`)
      .send({ item_estoque_id: item.id, quantidade: 6 });

    const res = await request(app)
      .patch(`/api/service-orders/${osRes.body.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "CANCELADA" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("CANCELADA");

    const itemAtualizado = await prisma.stockItem.findUniqueOrThrow({
      where: { id: item.id },
    });
    expect(itemAtualizado.quantidade).toBe(10);
  });
});

describe("Quilometragem na abertura da OS", () => {
  it("quilometragem menor que a atual do veículo dá erro", async () => {
    const { token } = await criarProprietario();
    const { veiculo } = await criarClienteComVeiculo({
      quilometragem_atual: 10000,
    });
    const cliente = await prisma.vehicle
      .findUniqueOrThrow({ where: { id: veiculo.id } })
      .then((v) => ({ id: v.cliente_id }));

    const { res } = await abrirOrdem(token, {
      quilometragem_registrada: 9000,
      veiculoId: veiculo.id,
      clienteId: cliente.id,
    });

    expect(res.status).toBe(400);
    expect(mensagemErro(res)).toMatch(/não pode ser menor/i);

    const veiculoDepois = await prisma.vehicle.findUniqueOrThrow({
      where: { id: veiculo.id },
    });
    expect(veiculoDepois.quilometragem_atual).toBe(10000);
  });

  it("quilometragem maior que a atual atualiza o veículo", async () => {
    const { token } = await criarProprietario();
    const { veiculo } = await criarClienteComVeiculo({
      quilometragem_atual: 10000,
    });
    const cliente = await prisma.vehicle
      .findUniqueOrThrow({ where: { id: veiculo.id } })
      .then((v) => ({ id: v.cliente_id }));

    const { res } = await abrirOrdem(token, {
      quilometragem_registrada: 12000,
      veiculoId: veiculo.id,
      clienteId: cliente.id,
    });

    expect(res.status).toBe(201);

    const veiculoDepois = await prisma.vehicle.findUniqueOrThrow({
      where: { id: veiculo.id },
    });
    expect(veiculoDepois.quilometragem_atual).toBe(12000);
  });

  it("sem quilometragem informada, a OS abre normalmente e o veículo não muda", async () => {
    const { token } = await criarProprietario();
    const { veiculo } = await criarClienteComVeiculo({
      quilometragem_atual: 10000,
    });
    const cliente = await prisma.vehicle
      .findUniqueOrThrow({ where: { id: veiculo.id } })
      .then((v) => ({ id: v.cliente_id }));

    const { res } = await abrirOrdem(token, {
      veiculoId: veiculo.id,
      clienteId: cliente.id,
    });

    expect(res.status).toBe(201);
    const veiculoDepois = await prisma.vehicle.findUniqueOrThrow({
      where: { id: veiculo.id },
    });
    expect(veiculoDepois.quilometragem_atual).toBe(10000);
  });
});

describe("Transições de status", () => {
  const PERMITIDAS: [string, string][] = [
    ["ABERTA", "EM_ANDAMENTO"],
    ["ABERTA", "CANCELADA"],
    ["EM_ANDAMENTO", "FINALIZADA"],
    ["EM_ANDAMENTO", "CANCELADA"],
    ["FINALIZADA", "EM_ANDAMENTO"],
  ];

  const PROIBIDAS: [string, string][] = [
    ["ABERTA", "FINALIZADA"],
    ["EM_ANDAMENTO", "ABERTA"],
    ["FINALIZADA", "CANCELADA"],
    ["FINALIZADA", "ABERTA"],
    ["CANCELADA", "ABERTA"],
    ["CANCELADA", "EM_ANDAMENTO"],
    ["CANCELADA", "FINALIZADA"],
  ];

  it.each(PERMITIDAS)("permite %s -> %s", async (de, para) => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, de as any);

    const res = await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: para });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe(para);
  });

  it.each(PROIBIDAS)("bloqueia %s -> %s", async (de, para) => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, de as any);

    const res = await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: para });

    expect(res.status).toBe(409);
    expect(mensagemErro(res)).toMatch(/não é possível mudar o status/i);

    const ordemDepois = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id: ordem.id },
    });
    expect(ordemDepois.status).toBe(de);
  });
});

describe("Lembretes de manutenção ao finalizar a OS", () => {
  it("o lembrete marcado como feito recalcula próximo_km e próxima_data pela km atual", async () => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, "EM_ANDAMENTO");

    await prisma.vehicle.update({
      where: { id: ordem.veiculo_id },
      data: { quilometragem_atual: 50000 },
    });

    const criado = await criarLembrete(ordem.veiculo_id, {
      intervalo_dias: 90,
      intervalo_km: 5000,
      proxima_data: new Date("2020-01-01"),
      proximo_km: 10000,
    });

    const res = await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "FINALIZADA", lembretes_feitos: [criado.id] });

    expect(res.status).toBe(200);

    const lembrete = await prisma.maintenanceReminder.findUniqueOrThrow({
      where: { id: criado.id },
    });
    expect(lembrete.proximo_km).toBe(55000);

    const esperado = new Date();
    esperado.setDate(esperado.getDate() + 90);
    expect(lembrete.proxima_data.toISOString().slice(0, 10)).toBe(
      esperado.toISOString().slice(0, 10),
    );
  });

  it("só os lembretes marcados reiniciam; os outros ficam como estavam", async () => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, "EM_ANDAMENTO");
    const antiga = new Date("2020-01-01");
    const oleo = await criarLembrete(ordem.veiculo_id, {
      nome: "Troca de óleo",
      proxima_data: antiga,
      proximo_km: 1000,
    });
    const correia = await criarLembrete(ordem.veiculo_id, {
      nome: "Correia dentada",
      proxima_data: antiga,
      proximo_km: 1000,
    });

    await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "FINALIZADA", lembretes_feitos: [oleo.id] });

    const oleoDepois = await prisma.maintenanceReminder.findUniqueOrThrow({
      where: { id: oleo.id },
    });
    const correiaDepois = await prisma.maintenanceReminder.findUniqueOrThrow({
      where: { id: correia.id },
    });
    expect(oleoDepois.proxima_data.getTime()).toBeGreaterThan(antiga.getTime());
    expect(correiaDepois.proxima_data.getTime()).toBe(antiga.getTime());
    expect(correiaDepois.proximo_km).toBe(1000);
  });

  it("sem marcar nada, nenhum lembrete reinicia", async () => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, "EM_ANDAMENTO");
    const lembrete = await criarLembrete(ordem.veiculo_id, { proximo_km: 1000 });

    await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "FINALIZADA" });

    const depois = await prisma.maintenanceReminder.findUniqueOrThrow({
      where: { id: lembrete.id },
    });
    expect(depois.proximo_km).toBe(1000);
  });

  it("recusa lembrete de outro veículo (400) e não finaliza a OS", async () => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, "EM_ANDAMENTO");
    const outra = await criarOrdem(mecanico.usuario.id, "EM_ANDAMENTO");
    const deOutroCarro = await criarLembrete(outra.veiculo_id);

    const res = await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "FINALIZADA", lembretes_feitos: [deOutroCarro.id] });

    expect(res.status).toBe(400);
    const depois = await prisma.serviceOrder.findUniqueOrThrow({
      where: { id: ordem.id },
    });
    expect(depois.status).toBe("EM_ANDAMENTO");
  });

  it("sem lembrete cadastrado, finalizar a OS não falha", async () => {
    const { token } = await criarProprietario();
    const mecanico = await criarFuncionario();
    const ordem = await criarOrdem(mecanico.usuario.id, "EM_ANDAMENTO");

    const res = await request(app)
      .patch(`/api/service-orders/${ordem.id}/status`)
      .set("Authorization", `Bearer ${token}`)
      .send({ status: "FINALIZADA" });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("FINALIZADA");
  });
});