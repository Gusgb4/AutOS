import {
  BarChart3,
  ClipboardList,
  DollarSign,
  Home,
  Package,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const menuItems = [
  { label: "Início", path: "/", icon: Home },
  { label: "Ordens de Serviço", path: "/ordens-servico", icon: ClipboardList },
  { label: "Clientes", path: "/clientes", icon: Users },
  { label: "Estoque", path: "/estoque", icon: Package },
  { label: "Financeiro", path: "/financeiro", icon: DollarSign },
  { label: "Relatórios", path: "/relatorios", icon: BarChart3 },
];

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-24 flex-col bg-[#1F1F1F] text-white">
      {/* Logo */}
      <div className="flex h-28 items-center justify-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF7518]">
          <Wrench size={27} strokeWidth={2.5} />
        </div>
      </div>

      {/* Menu */}
      <nav className="flex flex-1 flex-col items-center gap-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
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
      </nav>

      {/* Configurações */}
      <div className="pb-4">
        <button
          type="button"
          className="flex w-full flex-col items-center gap-1.5 py-4 text-gray-400 transition hover:text-white"
        >
          <Settings size={21} />
          <span className="text-[11px]">Configurações</span>
        </button>
      </div>
    </aside>
  );
}