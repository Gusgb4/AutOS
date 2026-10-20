import { api } from "./api";
import type { StatusPagamento } from "./serviceOrders";

export type TipoLancamento = "RECEITA" | "DESPESA";

export interface FinancialEntry {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: string;
  data: string;
  estornado: boolean;
  ordemId: number | null;
  ordemServico: {
    id: number;
    status: string;
    valor_total: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialEntryPayload {
  tipo: TipoLancamento;
  descricao: string;
  valor: number;
  data?: string;
}

export interface FinancialFilters {
  tipo?: TipoLancamento;
  inicio?: string;
  fim?: string;
}

export async function listFinancialEntries(
  filtros: FinancialFilters = {},
): Promise<FinancialEntry[]> {
  const params: Record<string, string> = {};
  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.inicio) params.inicio = filtros.inicio;
  if (filtros.fim) params.fim = filtros.fim;

  const { data } = await api.get<FinancialEntry[]>("/financial", {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
}

export async function createFinancialEntry(payload: FinancialEntryPayload) {
  const { data } = await api.post<FinancialEntry>("/financial", payload);
  return data;
}

export interface ContasAReceber {
  total: string;
  ordens: {
    id: number;
    cliente: { id: number; nome: string };
    valor_total: string;
    valor_pago: string;
    saldo: string;
    status_pagamento: StatusPagamento;
    finalizada_em: string;
  }[];
}

export async function getContasAReceber() {
  const { data } = await api.get<ContasAReceber>("/financial/a-receber");
  return data;
}

export interface TotaisFinanceiros {
  entradas: number;
  saidas: number;
  saldo: number;
}

export interface ResumoFinanceiro {
  periodo: { inicio: string; fim: string };
  periodo_anterior: { inicio: string; fim: string };
  atual: TotaisFinanceiros;
  anterior: TotaisFinanceiros;
  variacao: {
    entradas: number | null;
    saidas: number | null;
    saldo: number | null;
  };
}

// Sem datas: mês atual comparado com o mês anterior
export async function getResumoFinanceiro(inicio?: string, fim?: string) {
  const { data } = await api.get<ResumoFinanceiro>("/financial/resumo", {
    params: inicio && fim ? { inicio, fim } : undefined,
  });
  return data;
}
