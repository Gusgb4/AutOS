import { api } from "./api";
import type { FormaPagamento, StatusPagamento } from "./serviceOrders";

export type TipoLancamento = "RECEITA" | "DESPESA";

export interface FinancialEntry {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: string;
  data: string;
  estornado: boolean;
  forma_pagamento: FormaPagamento | null;
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

export interface ContaAReceber {
  id: number;
  valor_total: string;
  valor_pago: string;
  saldo: string;
  status_pagamento: StatusPagamento;
  created_at: string;
  cliente: { id: number; nome: string; telefone: string };
  veiculo: { id: number; placa: string; marca: string; modelo: string };
}

export async function listarAReceber(): Promise<{
  total: string;
  ordens: ContaAReceber[];
}> {
  const { data } = await api.get("/financial/a-receber");
  return data;
}
