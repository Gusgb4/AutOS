import { api } from "./api";

export type Perfil = "PROPRIETARIO" | "FUNCIONARIO";

export interface User {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
}

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface RegisterPayload {
  nome: string;
  email: string;
  senha: string;
  perfil?: Perfil;
}

export interface LoginResponse {
  user: User;
  token: string;
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", payload);
  return data;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await api.post<User>("/auth/register", payload);
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me");
  return data;
}