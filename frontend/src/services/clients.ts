import { api } from "./api";
import type { Vehicle } from "./vehicles";

export interface Client {
  id: number;
  nome: string;
  telefone: string;
  documento?: string;
  email?: string | null;
  endereco?: string | null;
  created_at: string;
  veiculos: Vehicle[];
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

export async function listClients(busca?: string): Promise<Client[]> {
  const { data } = await api.get<Client[]>("/clients", {
    params: busca ? { busca } : undefined,
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