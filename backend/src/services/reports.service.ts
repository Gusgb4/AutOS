import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

interface PeriodoInput {
  inicio?: string;
  fim?: string;
}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const UM_DIA_EM_MS = 24 * 60 * 60 * 1000;

// Interpreta "YYYY-MM-DD" como o começo do dia no horário de Brasília (UTC-03:00).
// Sem isso, a data seria lida como UTC e uma OS finalizada à noite cairia no dia seguinte.
function parseData(valor: string | undefined, nomeCampo: string): Date | undefined {
  if (!valor) return undefined;

  if (!FORMATO_DATA.test(valor)) {
    throw new AppError(`Data inválida em "${nomeCampo}". Use o formato YYYY-MM-DD.`, 400);
  }

  const data = new Date(`${valor}T00:00:00-03:00`);
  if (Number.isNaN(data.getTime())) {
    throw new AppError(`Data inválida em "${nomeCampo}".`, 400);
  }
  return data;
}

export async function vendasPorPeriodo({ inicio, fim }: PeriodoInput) {
  const dataInicio = parseData(inicio, "inicio");
  const dataFim = parseData(fim, "fim");

  if (dataInicio && dataFim && dataInicio > dataFim) {
    throw new AppError('"inicio" não pode ser depois de "fim".', 400);
  }

  // O "fim" é inclusivo para o usuário: fim=2026-09-28 deve incluir o dia 28 inteiro.
  // Por isso o limite superior é o começo do dia seguinte, comparado com "lt" (menor que).
  const limiteSuperior = dataFim ? new Date(dataFim.getTime() + UM_DIA_EM_MS) : undefined;

  const filtroData =
    dataInicio || limiteSuperior
      ? {
          ...(dataInicio ? { gte: dataInicio } : {}),
          ...(limiteSuperior ? { lt: limiteSuperior } : {}),
        }
      : undefined;

  const resultado = await prisma.serviceOrder.aggregate({
    where: {
      status: "FINALIZADA",
      ...(filtroData ? { updated_at: filtroData } : {}),
    },
    _sum: { valor_total: true },
    _count: { _all: true },
  });

  const totalVendas = resultado._sum.valor_total?.toNumber() ?? 0;
  const numeroOrdens = resultado._count._all;
  const ticketMedio = numeroOrdens > 0 ? totalVendas / numeroOrdens : 0;

  return {
    // Eco do que o usuário enviou (YYYY-MM-DD), não das datas convertidas.
    periodo: {
      inicio: inicio ?? null,
      fim: fim ?? null,
    },
    total_vendas: totalVendas,
    numero_os: numeroOrdens,
    ticket_medio: ticketMedio,
  };
}