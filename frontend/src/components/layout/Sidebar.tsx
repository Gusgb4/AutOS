import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Home,
  LogOut,
  Package,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getUserRole, PERFIL_LABEL } from "../../lib/auth";
import { useAuth } from "../../contexts/AuthContext";

const menuItems = [
  { label: "Início", path: "/", icon: Home, restrito: false },
  {
    label: "Ordens de Serviço",
    path: "/ordens-servico",
    icon: ClipboardList,
    restrito: false,
  },
  { label: "Clientes", path: "/clientes", icon: Users, restrito: false },
  { label: "Estoque", path: "/estoque", icon: Package, restrito: false },
  {
    label: "Financeiro",
    path: "/financeiro",
    icon: DollarSign,
    restrito: true,
  },
  {
    label: "Relatórios",
    path: "/relatorios",
    icon: BarChart3,
    restrito: true,
  },
];

const menuItemsFuturos = [{ label: "Produtividade", icon: Wrench }];

export default function Sidebar() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const perfil = getUserRole();
  const primeiroNome = user?.nome?.split(" ")[0] ?? "";
  const itensVisiveis = menuItems.filter(
    (item) => !item.restrito || perfil === "PROPRIETARIO",
  );

  function handleLogout() {
    // signOut limpa token e usuário (antes só o token era removido)
    signOut();
    navigate("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-24 flex-col bg-[#1F1F1F] text-white">
      {/* Logo */}
      <div className="flex h-28 shrink-0 items-center justify-center [@media(max-height:850px)]:h-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF7518] [@media(max-height:850px)]:h-11 [@media(max-height:850px)]:w-11">
          <Wrench size={27} strokeWidth={2.5} />
        </div>
      </div>

      {/* Menu: se não couber, só esta área rola */}
      <nav className="flex min-h-0 flex-1 flex-col items-center gap-1 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {itensVisiveis.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className="group flex w-full flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center [@media(max-height:850px)]:gap-1 [@media(max-height:850px)]:py-1.5"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition [@media(max-height:850px)]:h-9 [@media(max-height:850px)]:w-9 ${
                      isActive
                        ? "bg-[#FF7518] text-white"
                        : "text-gray-400 group-hover:bg-[#292929] group-hover:text-white"
                    }`}
                  >
                    <Icon size={20} strokeWidth={1.8} />
                  </div>
                  <span
                    className={`text-[11px] leading-tight ${
                      isActive
                        ? "font-medium text-white"
                        : "text-gray-400 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}

        {perfil === "PROPRIETARIO" &&
          menuItemsFuturos.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                title="Disponível em uma próxima versão"
                className="flex w-full cursor-not-allowed flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center opacity-40 [@media(max-height:850px)]:gap-1 [@media(max-height:850px)]:py-1.5"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500 [@media(max-height:850px)]:h-9 [@media(max-height:850px)]:w-9">
                  <Icon size={20} strokeWidth={1.8} />
                </div>
                <span className="text-[11px] leading-tight text-gray-500">
                  {item.label}
                </span>
              </div>
            );
          })}
      </nav>

      {/* Rodapé: sempre visível */}
      <div className="shrink-0 pb-2">
        {perfil && (
          <div className="mx-2 mb-2 rounded-xl bg-[#292929] px-1.5 py-2 text-center [@media(max-height:850px)]:mb-1 [@media(max-height:850px)]:py-1">
            {primeiroNome && (
              <p
                className="truncate text-[11px] font-medium text-white"
                title={user?.nome}
              >
                {primeiroNome}
              </p>
            )}
            <p
              className={`truncate text-[10px] ${
                perfil === "PROPRIETARIO" ? "text-[#FF7518]" : "text-gray-400"
              }`}
            >
              {PERFIL_LABEL[perfil]}
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full flex-col items-center gap-1 py-2 text-gray-400 transition hover:text-red-400 [@media(max-height:850px)]:py-1"
        >
          <LogOut size={21} />
          <span className="text-[11px]">Sair</span>
        </button>
      </div>
    </aside>
  );
}