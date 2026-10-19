// frontend/src/services/stock.ts
import { api } from "./api";

export type SituacaoPrevisao =
  | "ESGOTADO"
  | "SEM_CONSUMO"
  | "MENOS_DE_1_SEMANA"
  | "SEMANAS"
  | "MAIS_DE_1_ANO";

// Calculada no backend com as OS finalizadas dos últimos 90 dias; só quantidades
export interface PrevisaoFalta {
  consumo_90_dias: number;
  // Consumo dos 90 dias dividido por 3
  media_mensal: number;
  situacao: SituacaoPrevisao;
  // Semanas arredondadas; só vem na situação SEMANAS
  semanas: number | null;
}

export interface StockItem {
  id: number;
  nome: string;
  categoria: string | null;
  fornecedor: string | null;
  quantidade: number;
  quantidade_minima: number;
  valor_final: string;
  // Só vem para PROPRIETARIO; null quando o custo não foi informado
  valor_entrada?: string | null;
  alerta_minimo: boolean;
  // Arquivado: fora das listas, mas continua nas OS antigas
  ativo: boolean;
  // Já usado em alguma OS (inclusive cancelada): não pode ser excluído
  usado_em_os: boolean;
  // Data de abertura da última OS não cancelada que usou o item
  ultimo_uso: string | null;
  parado: boolean;
  previsao: PrevisaoFalta;
  created_at: string;
  updated_at: string;
}

export interface StockItemPayload {
  nome: string;
  categoria?: string;
  fornecedor?: string;
  quantidade: number;
  quantidade_minima: number;
  valor_final: number;
  valor_entrada?: number | null;
}

// Por padrão só vêm os itens ativos. incluirArquivados só vale para o proprietário.
export async function listStock(
  lowStockOnly = false,
  incluirArquivados = false,
): Promise<StockItem[]> {
  const { data } = await api.get<StockItem[]>("/stock", {
    params: {
      ...(lowStockOnly ? { lowStockOnly: "true" } : {}),
      ...(incluirArquivados ? { incluirArquivados: "true" } : {}),
    },
  });
  return data;
}

export async function getStockItem(id: number): Promise<StockItem> {
  const { data } = await api.get<StockItem>(`/stock/${id}`);
  return data;
}

export async function createStockItem(payload: StockItemPayload) {
  const { data } = await api.post<StockItem>("/stock", payload);
  return data;
}

export async function updateStockItem(id: number, payload: Partial<StockItemPayload>) {
  const { data } = await api.put<StockItem>(`/stock/${id}`, payload);
  return data;
}

export async function deleteStockItem(id: number) {
  await api.delete(`/stock/${id}`);
}

export async function archiveStockItem(id: number) {
  const { data } = await api.patch<StockItem>(`/stock/${id}/archive`);
  return data;
}

export async function unarchiveStockItem(id: number) {
  const { data } = await api.patch<StockItem>(`/stock/${id}/unarchive`);
  return data;
}