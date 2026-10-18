import { CategoriaDespesa, Prisma } from "@prisma/client";
import { prisma } from "../config/prisma";

const FUSO = "-03:00";
const UM_DIA_MS = 24 * 60 * 60 * 1000;

export type TipoLancamento = "RECEITA" | "DESPESA";

interface Periodo {
  // "2026-10-01" a "2026-10-31" (fim inclusivo), no fuso de Brasília
  inicio?: string;
  fim?: string;
}

interface Filtros extends Periodo {
  tipo?: TipoLancamento;
  categoria?: CategoriaDespesa;
  estornados?: boolean;
}

function filtroPeriodo({ inicio, fim }: Periodo) {
  if (!inicio && !fim) return undefined;
  return {
    gte: inicio ? new Date(`${inicio}T00:00:00${FUSO}`) : undefined,
    lt: fim
      ? new Date(new Date(`${fim}T00:00:00${FUSO}`).getTime() + UM_DIA_MS)
      : undefined,
  };
}

export async function listEntries(filtros: Filtros) {
  const onde: Prisma.FinancialEntryWhereInput = {
    // Por padrão só os ativos; com estornados=true vêm os dois
    estornado: filtros.estornados ? undefined : false,
    tipo: filtros.tipo,
    categoria: filtros.categoria,
    data: filtroPeriodo(filtros),
  };

  return prisma.financialEntry.findMany({
    where: onde,
    include: {
      ordemServico: { select: { id: true, status: true, valor_total: true } },
    },
    orderBy: { data: "desc" },
  });
}

// Despesas ativas do período agrupadas por categoria, da maior para a menor
export async function despesasPorCategoria(periodo: Periodo) {
  const grupos = await prisma.financialEntry.groupBy({
    by: ["categoria"],
    where: { tipo: "DESPESA", estornado: false, data: filtroPeriodo(periodo) },
    _sum: { valor: true },
  });

  const total = grupos.reduce(
    (acc, g) => acc.plus(g._sum.valor ?? 0),
    new Prisma.Decimal(0),
  );

  const categorias = grupos
    .map((g) => {
      const valor = g._sum.valor ?? new Prisma.Decimal(0);
      return {
        categoria: g.categoria ?? "OUTROS",
        valor: valor.toDecimalPlaces(2).toNumber(),
        percentual: total.isZero()
          ? 0
          : valor.div(total).mul(100).toDecimalPlaces(1).toNumber(),
      };
    })
    .sort((a, b) => b.valor - a.valor);

  return { total: total.toDecimalPlaces(2).toNumber(), categorias };
}

export async function createEntry(dados: {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  data?: string;
  categoria?: CategoriaDespesa;
}) {
  return prisma.financialEntry.create({
    data: {
      tipo: dados.tipo,
      descricao: dados.descricao,
      valor: dados.valor,
      // Meio-dia de Brasília: "2026-10-18" não vira o dia anterior em UTC
      data: dados.data ? new Date(`${dados.data}T12:00:00${FUSO}`) : new Date(),
      categoria: dados.tipo === "DESPESA" ? dados.categoria : null,
      estornado: false,
    },
  });
}
