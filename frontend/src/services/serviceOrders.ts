import { api } from "./api";

export type StatusOS = "ABERTA" | "EM_ANDAMENTO" | "FINALIZADA" | "CANCELADA";

export type StatusPagamento = "PENDENTE" | "PARCIAL" | "PAGO";

export type FormaPagamento = "DINHEIRO" | "PIX" | "CARTAO" | "OUTRO";

export interface Pagamento {
  id: string;
  valor: string;
  data: string;
  forma_pagamento: FormaPagamento | null;
  estornado: boolean;
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
  observacoes: string | null;
  quilometragem_registrada: number | null;
  created_at: string;
  cliente: { id: number; nome: string; telefone: string };
  veiculo: {
    id: number;
    placa: string;
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
    item_estoque: {
      id: number;
      nome: string;
      quantidade: number;
      quantidade_minima: number;
    };
  }[];
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

export async function updateServiceOrderObservacoes(
  ordemId: number,
  observacoes: string,
) {
  const { data } = await api.patch<ServiceOrder>(
    `/service-orders/${ordemId}/observacoes`,
    {
      observacoes,
    },
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
