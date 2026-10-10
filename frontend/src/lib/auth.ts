import type { Perfil } from "../services/auth";

export type { Perfil };

// Texto exibido na interface para cada perfil
export const PERFIL_LABEL: Record<Perfil, string> = {
  PROPRIETARIO: "Proprietário",
  FUNCIONARIO: "Funcionário",
};

export function getUserRole(): Perfil | null {
  const token = localStorage.getItem("@autos:token");
  if (!token) return null;
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(
      atob(payload.replace(/-/g, "+").replace(/_/g, "/")),
    );
    return decoded.perfil ?? null;
  } catch {
    return null;
  }
}