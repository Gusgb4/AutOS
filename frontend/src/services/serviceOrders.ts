import { api } from "./api";

export type StatusOS = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";

export type StatusPagamento = "PENDENTE" | "PARCIAL" | "PAGO";

export type FormaPagamento =
  | "DINHEIRO"
  | "PIX"
  | "DEBITO"
  | "CREDITO"
  | "OUTRO";

// Texto mostrado na tela (a ordem aqui é a ordem dos botões)
export const FORMA_LABEL: Record<FormaPagamento, string> = {
  PIX: "Pix",
  DINHEIRO: "Dinheiro",
  DEBITO: "Débito",
  CREDITO: "Crédito",
  OUTRO: "Outro",
};

// Receita lançada à mão não tem forma de pagamento
export type FormaOuNaoInformado = FormaPagamento | "NAO_INFORMADO";

export function rotuloForma(forma: FormaOuNaoInformado | null) {
  return !forma || forma === "NAO_INFORMADO"
    ? "Não informado"
    : FORMA_LABEL[forma];
}

export interface Pagamento {
  id: string;
  valor: string;
  data: string;
  forma_pagamento: FormaPagamento | null;
  estornado: boolean;
}

// Só peças com custo registrado entram na margem
export interface MargemPecas {
  receita: string;
  custo: string;
  margem: string;
  percentual: string | null;
  pecas_com_custo: number;
  pecas_sem_custo: number;
  valor_sem_custo: string;
}

export interface ServiceOrder {
  id: number;
  cliente_id: number;
  veiculo_id: number;
  mecanico_id: number;
  status: StatusOS;
  valor_total: string;
  valor_pago: string;
  saldo: string;
  status_pagamento: StatusPagamento | null;
  // Informações ao cliente: saem no PDF
  observacoes: string | null;
  // O que o cliente relatou na entrada, antes do diagnóstico
  reclamacao: string | null;
  previsao_entrega: string | null;
  quilometragem_registrada: number | null;
  created_at: string;
  finalizada_em: string | null;
  cliente: { id: number; nome: string; telefone: string };
  veiculo: {
    id: number;
    placa: string;
    cor?: string | null;
    marca: string;
    modelo: string;
    ano: number;
  };
  mecanico: { id: number; nome: string; email: string; perfil: string };
  servicos: { id: number; descricao: string; valor: string }[];
  pecas: {
    id: number;
    quantidade: number;
    valor_unitario: string;
    // Só vem para o proprietário; null nas peças sem custo registrado
    valor_custo?: string | null;
    item_estoque: {
      id: number;
      nome: string;
      quantidade: number;
      quantidade_minima: number;
    };
  }[];
  // Só vem para o proprietário
  margem_pecas?: MargemPecas;
}

export async function listServiceOrders(
  status?: StatusOS,
  clienteId?: number,
  statusPagamento?: StatusPagamento,
): Promise<ServiceOrder[]> {
  // O axios omite da URL os parâmetros undefined
  const { data } = await api.get<ServiceOrder[]>("/service-orders", {
    params: {
      status,
      cliente_id: clienteId,
      status_pagamento: statusPagamento,
    },
  });
  return data;
}

export async function getServiceOrderById(id: number): Promise<ServiceOrder> {
  const { data } = await api.get<ServiceOrder>(`/service-orders/${id}`);
  return data;
}

export async function createServiceOrder(dados: {
  cliente_id: number;
  veiculo_id: number;
  mecanico_id: number;
  observacoes?: string;
  reclamacao?: string;
  previsao_entrega?: string; // "2026-10-25"
  quilometragem_registrada?: number;
}): Promise<ServiceOrder> {
  const { data } = await api.post<ServiceOrder>("/service-orders", dados);
  return data;
}

export async function addServiceToOrder(
  ordemId: number,
  dados: { descricao: string; valor: number },
) {
  const { data } = await api.post<ServiceOrder>(
    `/service-orders/${ordemId}/services`,
    dados,
  );
  return data;
}

export async function addPartToOrder(
  ordemId: number,
  dados: { item_estoque_id: number; quantidade: number },
) {
  const { data } = await api.post<{
    ordem: ServiceOrder;
    estoque_restante: number;
    alerta_minimo: boolean;
  }>(`/service-orders/${ordemId}/parts`, dados);
  return data;
}

export async function changeServiceOrderStatus(
  ordemId: number,
  status: StatusOS,
) {
  const { data } = await api.patch<ServiceOrder>(
    `/service-orders/${ordemId}/status`,
    { status },
  );
  return data;
}

export async function removeServiceFromOrder(
  ordemId: number,
  serviceId: number,
) {
  const { data } = await api.delete<ServiceOrder>(
    `/service-orders/${ordemId}/services/${serviceId}`,
  );
  return data;
}

export async function removePartFromOrder(ordemId: number, partId: number) {
  const { data } = await api.delete<ServiceOrder>(
    `/service-orders/${ordemId}/parts/${partId}`,
  );
  return data;
}

// Só os campos enviados mudam; "" apaga o campo
export async function updateServiceOrderDetalhes(
  ordemId: number,
  dados: {
    observacoes?: string;
    reclamacao?: string;
    previsao_entrega?: string; // "2026-10-25"
  },
) {
  const { data } = await api.patch<ServiceOrder>(
    `/service-orders/${ordemId}/detalhes`,
    dados,
  );
  return data;
}

export async function listPagamentos(ordemId: number) {
  const { data } = await api.get<Pagamento[]>(
    `/service-orders/${ordemId}/pagamentos`,
  );
  return data;
}

export async function registrarPagamento(
  ordemId: number,
  dados: { valor: number; forma_pagamento: FormaPagamento; data?: string },
) {
  const { data } = await api.post<Pagamento>(
    `/service-orders/${ordemId}/pagamentos`,
    dados,
  );
  return data;
}

export async function estornarPagamento(ordemId: number, pagamentoId: string) {
  const { data } = await api.patch<Pagamento>(
    `/service-orders/${ordemId}/pagamentos/${pagamentoId}/estornar`,
  );
  return data;
}
