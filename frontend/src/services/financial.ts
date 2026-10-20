import { api } from "./api";
import type { StatusPagamento } from "./serviceOrders";

export type TipoLancamento = "RECEITA" | "DESPESA";

export type CategoriaDespesa =
  | "ALUGUEL"
  | "SALARIO"
  | "PECAS"
  | "ENERGIA"
  | "OUTROS";

// Texto mostrado na tela para cada categoria (a ordem aqui é a ordem do select)
export const CATEGORIA_LABEL: Record<CategoriaDespesa, string> = {
  ALUGUEL: "Aluguel",
  SALARIO: "Salário",
  PECAS: "Peças",
  ENERGIA: "Energia",
  OUTROS: "Outros",
};

export interface FinancialEntry {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: string;
  data: string;
  estornado: boolean;
  categoria: CategoriaDespesa | null;
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
  categoria?: CategoriaDespesa;
}

export interface FinancialFilters {
  tipo?: TipoLancamento;
  categoria?: CategoriaDespesa;
  inicio?: string; // "2026-10-01"
  fim?: string; // "2026-10-31" (o backend conta o dia inteiro)
  estornados?: boolean;
}

export async function listFinancialEntries(
  filtros: FinancialFilters = {},
): Promise<FinancialEntry[]> {
  const params: Record<string, string> = {};
  if (filtros.tipo) params.tipo = filtros.tipo;
  if (filtros.categoria) params.categoria = filtros.categoria;
  if (filtros.inicio) params.inicio = filtros.inicio;
  if (filtros.fim) params.fim = filtros.fim;
  if (filtros.estornados) params.estornados = "true";

  const { data } = await api.get<FinancialEntry[]>("/financial", {
    params: Object.keys(params).length ? params : undefined,
  });
  return data;
}

export async function createFinancialEntry(payload: FinancialEntryPayload) {
  const { data } = await api.post<FinancialEntry>("/financial", payload);
  return data;
}

// Só lançamento manual; pagamento de OS é estornado na tela da OS
export async function estornarFinancialEntry(id: string) {
  const { data } = await api.patch<FinancialEntry>(
    `/financial/${id}/estornar`,
  );
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
  despesas_por_categoria: {
    categoria: CategoriaDespesa;
    valor: number;
    percentual: number;
  }[];
}

// Sem datas: mês atual comparado com o mês anterior
export async function getResumoFinanceiro(inicio?: string, fim?: string) {
  const { data } = await api.get<ResumoFinanceiro>("/financial/resumo", {
    params: inicio && fim ? { inicio, fim } : undefined,
  });
  return data;
}
