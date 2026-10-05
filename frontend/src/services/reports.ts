import { api } from "./api";

export interface PeriodoDatas {
  inicio: string;
  fim: string;
}

export interface ResumoVendas {
  total: number;
  ordens: number;
  ticket_medio: number;
}

export interface VendasPorPeriodo {
  periodo: PeriodoDatas;
  periodo_anterior: PeriodoDatas;
  atual: ResumoVendas;
  anterior: ResumoVendas;
  variacao: {
    total: number | null;
    ordens: number | null;
    ticket_medio: number | null;
  };
  por_dia: { data: string; ordens: number; total: number }[];
}

export interface StatusInventario {
  resumo: { total_itens: number; abaixo_minimo: number; valor_total: number };
  itens: {
    id: number;
    nome: string;
    categoria: string | null;
    fornecedor: string | null;
    quantidade: number;
    quantidade_minima: number;
    valor_unitario: number;
    valor_em_estoque: number;
    abaixo_minimo: boolean;
  }[];
}

export interface ResumoFinanceiro {
  periodo: PeriodoDatas;
  entradas: number;
  saidas: number;
  saldo: number;
  composicao_receita_os: {
    mao_de_obra: { valor: number; percentual: number };
    pecas: { valor: number; percentual: number };
    total: number;
  };
  outras_receitas: number;
}

export interface AtividadeClientes {
  periodo: PeriodoDatas;
  resumo: { clientes_atendidos: number; ordens: number; total: number };
  clientes: {
    cliente_id: number;
    nome: string;
    ordens: number;
    total: number;
    ticket_medio: number;
    ultima_os: string;
  }[];
}

export async function getVendasPorPeriodo(inicio: string, fim: string) {
  const { data } = await api.get<VendasPorPeriodo>("/reports/sales", {
    params: { inicio, fim },
  });
  return data;
}

export async function getStatusInventario() {
  const { data } = await api.get<StatusInventario>("/reports/inventory");
  return data;
}

export async function getResumoFinanceiro(inicio: string, fim: string) {
  const { data } = await api.get<ResumoFinanceiro>(
    "/reports/financial-summary",
    { params: { inicio, fim } },
  );
  return data;
}

export async function getAtividadeClientes(inicio: string, fim: string) {
  const { data } = await api.get<AtividadeClientes>(
    "/reports/client-activity",
    {
      params: { inicio, fim },
    },
  );
  return data;
}
