import { Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const FUSO = "-03:00";
const TRES_HORAS_MS = 3 * 60 * 60 * 1000;
const UM_DIA_MS = 24 * 60 * 60 * 1000;

const zero = () => new Prisma.Decimal(0);

export interface Periodo {
  inicio: Date;
  fimExclusivo: Date;
}

// "2026-10-01" a "2026-10-31" (fim inclusivo), no fuso de Brasília
export function parsePeriodo(inicio: string, fim: string): Periodo {
  const dataInicio = new Date(`${inicio}T00:00:00${FUSO}`);
  const dataFim = new Date(`${fim}T00:00:00${FUSO}`);
  return {
    inicio: dataInicio,
    fimExclusivo: new Date(dataFim.getTime() + UM_DIA_MS),
  };
}

export function parseMes(mes: string): Periodo {
  const [ano, numeroMes] = mes.split("-").map(Number);
  const ultimoDia = new Date(Date.UTC(ano, numeroMes, 0)).getUTCDate();
  return parsePeriodo(`${mes}-01`, `${mes}-${ultimoDia}`);
}

function periodoAnterior(p: Periodo): Periodo {
  const duracao = p.fimExclusivo.getTime() - p.inicio.getTime();
  return {
    inicio: new Date(p.inicio.getTime() - duracao),
    fimExclusivo: p.inicio,
  };
}

function diaBrasilia(data: Date): string {
  return new Date(data.getTime() - TRES_HORAS_MS).toISOString().slice(0, 10);
}

export function descreverPeriodo(p: Periodo) {
  return {
    inicio: diaBrasilia(p.inicio),
    fim: diaBrasilia(new Date(p.fimExclusivo.getTime() - 1)),
  };
}

export function arredondar(valor: Prisma.Decimal): number {
  return valor.toDecimalPlaces(2).toNumber();
}

function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

export function filtroOSFinalizada(p: Periodo): Prisma.ServiceOrderWhereInput {
  return {
    status: "FINALIZADA",
    finalizada_em: { gte: p.inicio, lt: p.fimExclusivo },
  };
}

function resumir(ordensFinalizadas: { valor_total: Prisma.Decimal }[]) {
  const total = ordensFinalizadas.reduce(
    (acc, o) => acc.plus(o.valor_total),
    zero(),
  );
  const ordens = ordensFinalizadas.length;
  const ticket = ordens > 0 ? total.div(ordens) : zero();
  return {
    total: arredondar(total),
    ordens,
    ticket_medio: arredondar(ticket),
  };
}

// ---------- 1. Vendas por período (com comparativo) ----------
export async function vendasPorPeriodo(p: Periodo) {
  const anterior = periodoAnterior(p);

  const [atuais, anteriores] = await Promise.all([
    prisma.serviceOrder.findMany({
      where: filtroOSFinalizada(p),
      select: { finalizada_em: true, valor_total: true },
      orderBy: { finalizada_em: "asc" },
    }),
    prisma.serviceOrder.findMany({
      where: filtroOSFinalizada(anterior),
      select: { valor_total: true },
    }),
  ]);

  const atual = resumir(atuais);
  const anteriorResumo = resumir(anteriores);

  const porDia = new Map<string, { ordens: number; total: Prisma.Decimal }>();
  for (const o of atuais) {
    const dia = diaBrasilia(o.finalizada_em!);
    const acumulado = porDia.get(dia) ?? { ordens: 0, total: zero() };
    acumulado.ordens += 1;
    acumulado.total = acumulado.total.plus(o.valor_total);
    porDia.set(dia, acumulado);
  }

  return {
    periodo: descreverPeriodo(p),
    periodo_anterior: descreverPeriodo(anterior),
    atual,
    anterior: anteriorResumo,
    variacao: {
      total: variacao(atual.total, anteriorResumo.total),
      ordens: variacao(atual.ordens, anteriorResumo.ordens),
      ticket_medio: variacao(atual.ticket_medio, anteriorResumo.ticket_medio),
    },
    por_dia: Array.from(porDia.entries()).map(([data, v]) => ({
      data,
      ordens: v.ordens,
      total: arredondar(v.total),
    })),
  };
}

// ---------- 2. Status do inventário ----------
export async function statusInventario() {
  const itens = await prisma.stockItem.findMany({
    where: { ativo: true },
    orderBy: { nome: "asc" },
  });

  let valorTotal = zero();
  const lista = itens.map((i) => {
    const valorEmEstoque = i.valor_final.mul(i.quantidade);
    valorTotal = valorTotal.plus(valorEmEstoque);
    return {
      id: i.id,
      nome: i.nome,
      categoria: i.categoria,
      fornecedor: i.fornecedor,
      quantidade: i.quantidade,
      quantidade_minima: i.quantidade_minima,
      valor_final: arredondar(i.valor_final),
      valor_em_estoque: arredondar(valorEmEstoque),
      abaixo_minimo: i.quantidade <= i.quantidade_minima,
    };
  });

  return {
    resumo: {
      total_itens: lista.length,
      abaixo_minimo: lista.filter((i) => i.abaixo_minimo).length,
      valor_total: arredondar(valorTotal),
    },
    itens: lista,
  };
}

// ---------- 3. Resumo financeiro ----------
// Aceita os dois pares de nomes (RECEITA/DESPESA e ENTRADA/SAIDA) por segurança
function ehReceita(tipo: string) {
  return ["RECEITA", "ENTRADA"].includes(tipo.trim().toUpperCase());
}
function ehDespesa(tipo: string) {
  return ["DESPESA", "SAIDA", "SAÍDA"].includes(tipo.trim().toUpperCase());
}

export async function resumoFinanceiro(p: Periodo) {
  const [lancamentos, ordensFinalizadas] = await Promise.all([
    prisma.financialEntry.findMany({
      where: { estornado: false, data: { gte: p.inicio, lt: p.fimExclusivo } },
      select: { tipo: true, valor: true, ordemId: true },
    }),
    prisma.serviceOrder.findMany({
      where: filtroOSFinalizada(p),
      select: { id: true },
    }),
  ]);

  let entradas = zero();
  let saidas = zero();
  let outrasReceitas = zero();
  const ordemIds = ordensFinalizadas.map((o) => o.id);

  for (const l of lancamentos) {
    if (ehReceita(l.tipo)) {
      entradas = entradas.plus(l.valor);
      if (l.ordemId === null) outrasReceitas = outrasReceitas.plus(l.valor);
    } else if (ehDespesa(l.tipo)) {
      saidas = saidas.plus(l.valor);
    }
  }

  let maoDeObra = zero();
  let pecas = zero();

  if (ordemIds.length > 0) {
    const servicos = await prisma.serviceOrderService.aggregate({
      where: { ordem_id: { in: ordemIds } },
      _sum: { valor: true },
    });
    maoDeObra = servicos._sum.valor ?? zero();

    const itens = await prisma.serviceOrderPart.findMany({
      where: { ordem_id: { in: ordemIds } },
      select: { quantidade: true, valor_unitario: true },
    });
    pecas = itens.reduce(
      (acc, i) => acc.plus(i.valor_unitario.mul(i.quantidade)),
      zero(),
    );
  }

  const baseOS = maoDeObra.plus(pecas);
  const percentual = (v: Prisma.Decimal) =>
    baseOS.isZero() ? 0 : v.div(baseOS).mul(100).toDecimalPlaces(1).toNumber();

  return {
    periodo: descreverPeriodo(p),
    entradas: arredondar(entradas),
    saidas: arredondar(saidas),
    saldo: arredondar(entradas.minus(saidas)),
    composicao_receita_os: {
      mao_de_obra: {
        valor: arredondar(maoDeObra),
        percentual: percentual(maoDeObra),
      },
      pecas: { valor: arredondar(pecas), percentual: percentual(pecas) },
      total: arredondar(baseOS),
    },
    outras_receitas: arredondar(outrasReceitas),
  };
}

// ---------- 4. Atividade do cliente ----------
export async function atividadeClientes(p: Periodo) {
  const ordensFinalizadas = await prisma.serviceOrder.findMany({
    where: filtroOSFinalizada(p),
    select: {
      valor_total: true,
      finalizada_em: true,
      cliente: { select: { id: true, nome: true } },
    },
  });

  const porCliente = new Map<
    number,
    {
      cliente_id: number;
      nome: string;
      ordens: number;
      total: Prisma.Decimal;
      ultima_os: Date;
    }
  >();

  for (const o of ordensFinalizadas) {
    const { cliente } = o;
    const finalizadaEm = o.finalizada_em!;

    const acumulado = porCliente.get(cliente.id) ?? {
      cliente_id: cliente.id,
      nome: cliente.nome,
      ordens: 0,
      total: zero(),
      ultima_os: finalizadaEm,
    };
    acumulado.ordens += 1;
    acumulado.total = acumulado.total.plus(o.valor_total);
    if (finalizadaEm > acumulado.ultima_os) acumulado.ultima_os = finalizadaEm;
    porCliente.set(cliente.id, acumulado);
  }

  const clientes = Array.from(porCliente.values())
    .sort((a, b) => b.total.comparedTo(a.total))
    .map((c) => ({
      cliente_id: c.cliente_id,
      nome: c.nome,
      ordens: c.ordens,
      total: arredondar(c.total),
      ticket_medio: arredondar(c.total.div(c.ordens)),
      ultima_os: diaBrasilia(c.ultima_os),
    }));

  return {
    periodo: descreverPeriodo(p),
    resumo: {
      clientes_atendidos: clientes.length,
      ordens: clientes.reduce((acc, c) => acc + c.ordens, 0),
      total: arredondar(clientes.reduce((acc, c) => acc.plus(c.total), zero())),
    },
    clientes,
  };
}
