export function getUserRole(): "PROPRIETARIO" | "FUNCIONARIO" | null {
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
