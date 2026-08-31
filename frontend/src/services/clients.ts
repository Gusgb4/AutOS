import { api } from "./api";
import type { Vehicle } from "./vehicles";

export interface Client {
  id: number;
  nome: string;
  telefone: string;
  documento?: string;
  veiculos: Vehicle[];
}

export interface CreateClientPayload {
  nome: string;
  telefone: string;
}

export interface UpdateClientPayload {
  nome?: string;
  telefone?: string;
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
  await api.delete(`/clients/${id}`);
}

export interface Client {
  id: number;
  nome: string;
  telefone: string;
  documento?: string;
  created_at: string;
  veiculos: Vehicle[];
}
