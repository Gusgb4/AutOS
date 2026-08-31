import { api } from "./api";

export interface Mechanic {
  id: number;
  nome: string;
  email: string;
  perfil: "PROPRIETARIO" | "FUNCIONARIO";
}

// ATENÇÃO: não vi ainda o users.routes.ts — confirma se o caminho é
// mesmo "/users" antes de testar, senão é 404 silencioso de novo.
interface UsersGroupedResponse {
  proprietarios: Mechanic[];
  funcionarios: Mechanic[];
}

export async function listUsers(): Promise<Mechanic[]> {
  const { data } = await api.get<UsersGroupedResponse>("/users");
  return [...data.proprietarios, ...data.funcionarios];
}
