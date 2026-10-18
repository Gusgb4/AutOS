import { api } from "./api";
import type { FormaPagamento, StatusPagamento } from "./serviceOrders";

export type TipoLancamento = "RECEITA" | "DESPESA";

export type CategoriaDespesa =
  | "ALUGUEL"
  | "SALARIO"
  | "PECAS"
  | "ENERGIA"
  | "OUTROS";

export const CATEGORIAS_DESPESA: { value: CategoriaDespesa; label: string }[] = [
  { value: "ALUGUEL", label: "Aluguel" },
  { value: "SALARIO", label: "Salário" },
  { value: "PECAS", label: "Peças" },
  { value: "ENERGIA", label: "Energia" },
  { value: "OUTROS", label: "Outros" },
];

export function categoriaLabel(categoria: CategoriaDespesa | null) {
  return CATEGORIAS_DESPESA.find((c) => c.value === categoria)?.label ?? "—";
}

export interface FinancialEntry {
  id: string;
  tipo: TipoLancamento;
  descricao: string;
  valor: string;
  data: string;
  estornado: boolean;
  forma_pagamento: FormaPagamento | null;
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

// Datas no formato AAAA-MM-DD (fim inclusivo)
export interface FinancialFilters {
  tipo?: TipoLancamento;
  categoria?: CategoriaDespesa;
  inicio?: string;
  fim?: string;
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

export interface DespesasPorCategoria {
  total: number;
  categorias: { categoria: CategoriaDespesa; valor: number; percentual: number }[];
}

export async function listDespesasPorCategoria(periodo: {
  inicio?: string;
  fim?: string;
}): Promise<DespesasPorCategoria> {
  const { data } = await api.get<DespesasPorCategoria>(
    "/financial/despesas-por-categoria",
    { params: { inicio: periodo.inicio || undefined, fim: periodo.fim || undefined } },
  );
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
