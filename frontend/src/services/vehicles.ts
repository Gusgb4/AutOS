import { api } from "./api";

export interface MaintenanceReminder {
  id: number;
  // "Troca de óleo", "Correia dentada"...
  nome: string;
  intervalo_dias: number;
  intervalo_km: number;
  proxima_data: string;
  proximo_km: number;
}

export interface Vehicle {
  id: number;
  cliente_id: number;
  placa: string;
  cor?: string | null;
  marca: string;
  modelo: string;
  ano: number;
  quilometragem_atual?: number;
  lembretes?: MaintenanceReminder[];
}

// Lembrete enviado ao salvar o veículo: com id é um que já existe
export interface LembretePayload {
  id?: number;
  nome: string;
  intervalo_dias: number;
  intervalo_km: number;
}

export interface CreateVehiclePayload {
  cliente_id: number;
  placa: string;
  cor?: string;
  marca: string;
  modelo: string;
  ano: number;
  quilometragem_atual?: number;
  // Ao editar, a lista enviada substitui os lembretes do veículo
  lembretes?: LembretePayload[];
}

export interface UpdateVehiclePayload {
  cliente_id?: number;
  placa?: string;
  cor?: string;
  marca?: string;
  modelo?: string;
  ano?: number;
  quilometragem_atual?: number;
  // Ao editar, a lista enviada substitui os lembretes do veículo
  lembretes?: LembretePayload[];
}

export async function listVehicles(placa?: string): Promise<Vehicle[]> {
  const { data } = await api.get<Vehicle[]>("/vehicles", {
    params: placa ? { placa } : undefined,
  });
  return data;
}

export async function getVehicleById(id: number): Promise<Vehicle> {
  const { data } = await api.get<Vehicle>(`/vehicles/${id}`);
  return data;
}

export async function createVehicle(
  payload: CreateVehiclePayload,
): Promise<Vehicle> {
  const { data } = await api.post<Vehicle>("/vehicles", payload);
  return data;
}

export async function updateVehicle(
  id: number,
  payload: UpdateVehiclePayload,
): Promise<Vehicle> {
  const { data } = await api.put<Vehicle>(`/vehicles/${id}`, payload);
  return data;
}

export async function deleteVehicle(id: number): Promise<void> {
  // Arquiva em vez de apagar (rota PATCH do backend)
  const response = await api.patch(`/vehicles/${id}/archive`);
  return response.data;
}
