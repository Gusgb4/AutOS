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

export async function listUsers(): Promise<Mechanic[]> {
  const { data } = await api.get<UsersGroupedResponse>("/users");
  return [...data.proprietarios, ...data.funcionarios];
}

export async function listTeam(): Promise<TeamMember[]> {
  const { data } = await api.get<UsersGroupedResponse>("/users");
  return [...data.proprietarios, ...data.funcionarios];
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

export interface ResumoProdutividade {
  ordens: number;
  faturamento: number;
  mao_de_obra: number;
  ticket_medio: number;
}

export interface ProdutividadeMembro extends ResumoProdutividade {
  id: number;
  nome: string;
  email: string;
  perfil: "PROPRIETARIO" | "FUNCIONARIO";
  ativo: boolean;
}

export interface Produtividade {
  periodo: { inicio: string; fim: string };
  resumo: ResumoProdutividade;
  membros: ProdutividadeMembro[];
}

export async function getProdutividade(mes: string): Promise<Produtividade> {
  const { data } = await api.get<Produtividade>("/users/produtividade", {
    params: { mes },
  });
  return data;
}
