import { Navigate, Outlet } from "react-router-dom";
import { getUserRole, type Perfil } from "../lib/auth";

interface RoleRouteProps {
  allowed: Perfil[];
}

/** Bloqueia o acesso direto pela URL para quem não tem o perfil exigido. */
export default function RoleRoute({ allowed }: RoleRouteProps) {
  const perfil = getUserRole();

  if (!perfil || !allowed.includes(perfil)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}