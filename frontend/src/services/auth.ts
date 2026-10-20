import { api } from "./api";

export type Perfil = "PROPRIETARIO" | "FUNCIONARIO";

export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  ativo?: boolean;
  trocar_senha?: boolean;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface ChangePasswordPayload {
  senha_atual: string;
  nova_senha: string;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}

export async function trocarSenha(
  payload: ChangePasswordPayload,
): Promise<{ message: string }> {
  const { data } = await api.patch<{ message: string }>("/auth/senha", payload);
  return data;
}