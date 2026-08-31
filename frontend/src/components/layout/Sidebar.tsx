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
import { getUserRole } from "../../lib/auth";

const menuItems = [
  { label: "Início", path: "/", icon: Home, restrito: false },
  {
    label: "Ordens de Serviço",
    path: "/ordens-servico",
    icon: ClipboardList,
    restrito: false,
  },
  { label: "Clientes", path: "/clientes", icon: Users, restrito: false },
  { label: "Estoque", path: "/estoque", icon: Package, restrito: true },
];

const menuItemsFuturos = [
  { label: "Financeiro", icon: DollarSign },
  { label: "Relatórios", icon: BarChart3 },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const perfil = getUserRole();
  const itensVisiveis = menuItems.filter(
    (item) => !item.restrito || perfil === "PROPRIETARIO",
  );

  function handleLogout() {
    localStorage.removeItem("@autos:token");
    navigate("/login");
  }

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-24 flex-col bg-[#1F1F1F] text-white">
      <div className="flex h-28 items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF7518]">
          <Wrench size={27} strokeWidth={2.5} />
        </div>
      </div>

      <nav className="flex flex-1 flex-col items-center gap-1">
        {itensVisiveis.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className="group flex w-full flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center"
            >
              {({ isActive }) => (
                <>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl transition ${
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

        {menuItemsFuturos.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              title="Disponível em uma próxima versão"
              className="flex w-full cursor-not-allowed flex-col items-center justify-center gap-1.5 px-2 py-2.5 text-center opacity-40"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl text-gray-500">
                <Icon size={20} strokeWidth={1.8} />
              </div>
              <span className="text-[11px] leading-tight text-gray-500">
                {item.label}
              </span>
            </div>
          );
        })}
      </nav>

      <div className="pb-4">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full flex-col items-center gap-1.5 py-4 text-gray-400 transition hover:text-red-400"
        >
          <LogOut size={21} />
          <span className="text-[11px]">Sair</span>
        </button>
      </div>
    </aside>
  );
}
