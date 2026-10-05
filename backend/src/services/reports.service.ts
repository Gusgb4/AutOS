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

function descreverPeriodo(p: Periodo) {
  return {
    inicio: diaBrasilia(p.inicio),
    fim: diaBrasilia(new Date(p.fimExclusivo.getTime() - 1)),
  };
}

function arredondar(valor: Prisma.Decimal): number {
  return valor.toDecimalPlaces(2).toNumber();
}

function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / anterior) * 1000) / 10;
}

// Receita de OS ativa (não estornada) dentro do período
function filtroReceitaOS(p: Periodo): Prisma.FinancialEntryWhereInput {
  return {
    tipo: "RECEITA",
    estornado: false,
    ordemId: { not: null },
    data: { gte: p.inicio, lt: p.fimExclusivo },
  };
}

function resumir(entradas: { valor: Prisma.Decimal }[]) {
  const total = entradas.reduce((acc, e) => acc.plus(e.valor), zero());
  const ordens = entradas.length;
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
    prisma.financialEntry.findMany({
      where: filtroReceitaOS(p),
      select: { data: true, valor: true },
      orderBy: { data: "asc" },
    }),
    prisma.financialEntry.findMany({
      where: filtroReceitaOS(anterior),
      select: { data: true, valor: true },
    }),
  ]);

  const atual = resumir(atuais);
  const anteriorResumo = resumir(anteriores);

  const porDia = new Map<string, { ordens: number; total: Prisma.Decimal }>();
  for (const e of atuais) {
    const dia = diaBrasilia(e.data);
    const acumulado = porDia.get(dia) ?? { ordens: 0, total: zero() };
    acumulado.ordens += 1;
    acumulado.total = acumulado.total.plus(e.valor);
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
// ATENÇÃO: quando o card "Estoque - Polimentos" renomear valor_unitario
// para valor_final, trocar aqui também.
export async function statusInventario() {
  const itens = await prisma.stockItem.findMany({ orderBy: { nome: "asc" } });

  let valorTotal = zero();
  const lista = itens.map((i) => {
    const valorEmEstoque = i.valor_unitario.mul(i.quantidade);
    valorTotal = valorTotal.plus(valorEmEstoque);
    return {
      id: i.id,
      nome: i.nome,
      categoria: i.categoria,
      fornecedor: i.fornecedor,
      quantidade: i.quantidade,
      quantidade_minima: i.quantidade_minima,
      valor_unitario: arredondar(i.valor_unitario),
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
  const lancamentos = await prisma.financialEntry.findMany({
    where: { estornado: false, data: { gte: p.inicio, lt: p.fimExclusivo } },
    select: { tipo: true, valor: true, ordemId: true },
  });

  let entradas = zero();
  let saidas = zero();
  const ordemIds: number[] = [];

  for (const l of lancamentos) {
    if (ehReceita(l.tipo)) {
      entradas = entradas.plus(l.valor);
      if (l.ordemId !== null) ordemIds.push(l.ordemId);
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
      mao_de_obra: { valor: arredondar(maoDeObra), percentual: percentual(maoDeObra) },
      pecas: { valor: arredondar(pecas), percentual: percentual(pecas) },
      total: arredondar(baseOS),
    },
    outras_receitas: arredondar(entradas.minus(baseOS)),
  };
}

// ---------- 4. Atividade do cliente ----------
export async function atividadeClientes(p: Periodo) {
  const entradas = await prisma.financialEntry.findMany({
    where: filtroReceitaOS(p),
    select: {
      valor: true,
      data: true,
      ordemServico: {
        select: { cliente: { select: { id: true, nome: true } } },
      },
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

  for (const e of entradas) {
    const cliente = e.ordemServico?.cliente;
    if (!cliente) continue;

    const acumulado = porCliente.get(cliente.id) ?? {
      cliente_id: cliente.id,
      nome: cliente.nome,
      ordens: 0,
      total: zero(),
      ultima_os: e.data,
    };
    acumulado.ordens += 1;
    acumulado.total = acumulado.total.plus(e.valor);
    if (e.data > acumulado.ultima_os) acumulado.ultima_os = e.data;
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
      total: arredondar(
        clientes.reduce((acc, c) => acc.plus(c.total), zero()),
      ),
    },
    clientes,
  };
}