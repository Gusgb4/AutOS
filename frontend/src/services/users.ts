import { api } from "./api";

export interface Mechanic {
  id: number;
  nome: string;
  email: string;
  perfil: "PROPRIETARIO" | "FUNCIONARIO";
}

// Membro da equipe, com status e contagem de OS (vem do GET /users)
export interface TeamMember extends Mechanic {
  ativo: boolean;
  /** Todas as OS do mecânico, exceto as canceladas. */
  total_os: number;
  /** OS ainda em curso (abertas ou em andamento). */
  os_ativas: number;
}

interface UsersGroupedResponse {
  proprietarios: TeamMember[];
  funcionarios: TeamMember[];
}

// Resposta do PATCH de ativar/desativar (sem a contagem de OS)
export interface UserStatusResponse {
  id: number;
  nome: string;
  email: string;
  perfil: "PROPRIETARIO" | "FUNCIONARIO";
  ativo: boolean;
}

export interface CreateUserPayload {
  nome: string;
  email: string;
  perfil: "PROPRIETARIO" | "FUNCIONARIO";
}

export interface CreateUserResponse {
  usuario: TeamMember;
  senha_provisoria: string;
}

export interface ResetPasswordResponse {
  usuario: UserStatusResponse;
  senha_provisoria: string;
}

export async function listUsers(): Promise<Mechanic[]> {
  const { data } = await api.get<UsersGroupedResponse>("/users");
  return [...data.proprietarios, ...data.funcionarios];
}

export async function listTeam(): Promise<TeamMember[]> {
  const { data } = await api.get<UsersGroupedResponse>("/users");
  return [...data.proprietarios, ...data.funcionarios];
}

export async function createUser(
  payload: CreateUserPayload,
): Promise<CreateUserResponse> {
  const { data } = await api.post<CreateUserResponse>("/users", payload);
  return data;
}

export async function resetUserPassword(
  id: number,
): Promise<ResetPasswordResponse> {
  const { data } = await api.patch<ResetPasswordResponse>(
    `/users/${id}/redefinir-senha`,
  );
  return data;
}

export async function deactivateUser(id: number): Promise<UserStatusResponse> {
  const { data } = await api.patch<UserStatusResponse>(
    `/users/${id}/deactivate`,
  );
  return data;
}

export async function activateUser(id: number): Promise<UserStatusResponse> {
  const { data } = await api.patch<UserStatusResponse>(`/users/${id}/activate`);
  return data;
}