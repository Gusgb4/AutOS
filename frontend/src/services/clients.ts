import { api } from "./api";
import type { Vehicle } from "./vehicles";

export interface Client {
  id: number;
  nome: string;
  telefone: string;
  documento?: string;
  email?: string | null;
  endereco?: string | null;
  // LGPD: quando os dados pessoais foram apagados a pedido do titular
  anonimizado_em?: string | null;
  created_at: string;
  // Só veículos ativos (o backend já filtra)
  veiculos: Vehicle[];
  // Vêm só na listagem (GET /clients)
  total_gasto?: number; // soma das OS finalizadas
  qtd_os?: number; // quantidade de OS finalizadas
  ultima_visita?: string | null; // OS mais recente que não foi cancelada
}

export interface CreateClientPayload {
  nome: string;
  telefone: string;
  email?: string;
  endereco?: string;
}

export interface UpdateClientPayload {
  nome?: string;
  telefone?: string;
  email?: string;
  endereco?: string;
}

// Por padrão só clientes ativos; arquivados = true traz só os arquivados
export async function listClients(
  busca?: string,
  opcoes: { arquivados?: boolean } = {},
): Promise<Client[]> {
  const { data } = await api.get<Client[]>("/clients", {
    params: {
      busca: busca || undefined,
      arquivados: opcoes.arquivados ? "true" : undefined,
    },
  });
  return data;
}

export async function getClientById(id: number): Promise<Client> {
  const { data } = await api.get<Client>(`/clients/${id}`);
  return data;
}

export async function createClient(
  payload: CreateClientPayload,
): Promise<Client> {
  const { data } = await api.post<Client>("/clients", payload);
  return data;
}

export async function updateClient(
  id: number,
  payload: UpdateClientPayload,
): Promise<Client> {
  const { data } = await api.put<Client>(`/clients/${id}`, payload);
  return data;
}

// Apaga os dados pessoais e a placa dos veículos; as OS continuam. Não tem volta.
export async function anonimizarCliente(id: number): Promise<Client> {
  const { data } = await api.post<Client>(`/clients/${id}/anonimizar`);
  return data;
}

export async function deleteClient(id: number): Promise<void> {
  const response = await api.patch(`/clients/${id}/archive`);
  return response.data;
  //await api.delete(`/clients/${id}`);
}

/**
 * Converte os dados do formulário em payload para a API.
 * Campos opcionais vazios não são enviados (evita falhar na validação
 * de email e salvar string vazia no banco).
 */
export function buildClientPayload(data: {
  nome: string;
  telefone: string;
  email: string;
  endereco: string;
}): CreateClientPayload {
  const email = data.email.trim();
  const endereco = data.endereco.trim();

  return {
    nome: data.nome.trim(),
    telefone: data.telefone.trim(),
    ...(email ? { email } : {}),
    ...(endereco ? { endereco } : {}),
  };
}