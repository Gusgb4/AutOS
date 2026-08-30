// frontend/src/services/stock.ts
import { api } from "./api";

export interface StockItem {
  id: number;
  nome: string;
  categoria: string | null;
  fornecedor: string | null;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: string;
  alerta_minimo: boolean;
  created_at: string;
  updated_at: string;
}

export interface StockItemPayload {
  nome: string;
  categoria?: string;
  fornecedor?: string;
  quantidade: number;
  quantidade_minima: number;
  valor_unitario: number;
}

export async function listStock(lowStockOnly = false): Promise<StockItem[]> {
  const { data } = await api.get<StockItem[]>("/stock", {
    params: lowStockOnly ? { lowStockOnly: "true" } : undefined,
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