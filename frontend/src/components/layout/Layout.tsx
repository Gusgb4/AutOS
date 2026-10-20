import { useState, useSyncExternalStore } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Menu, Wrench } from "lucide-react";
import Sidebar from "./Sidebar";
import NotificationBell from "./NotificationBell";

// Mesmo ponto do prefixo md: do Tailwind (48rem = 768px)
const TELA_GRANDE = "(min-width: 48rem)";

function assinarTela(aviso: () => void) {
  const mq = window.matchMedia(TELA_GRANDE);
  mq.addEventListener("change", aviso);
  return () => mq.removeEventListener("change", aviso);
}

function useTelaGrande() {
  return useSyncExternalStore(
    assinarTela,
    () => window.matchMedia(TELA_GRANDE).matches,
  );
}

export default function Layout() {
  const location = useLocation();
  const telaGrande = useTelaGrande();

  // Guarda em qual navegação o menu foi aberto: ao trocar de página
  // (item do menu ou notificação) ele fecha sozinho
  const [menuAbertoEm, setMenuAbertoEm] = useState<string | null>(null);
  const menuAberto = menuAbertoEm === location.key;

  return (
    <div className="min-h-screen bg-[#F6F7F9]">
      {/* Barra do topo: só no celular */}
      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 bg-[#1F1F1F] px-3 text-white md:hidden">
        <button
          type="button"
          onClick={() => setMenuAbertoEm(location.key)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
          className="flex h-11 w-11 items-center justify-center rounded-xl text-gray-300 transition hover:bg-[#292929] hover:text-white"
        >
          <Menu size={22} />
        </button>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF7518]">
          <Wrench size={20} strokeWidth={2.5} />
        </div>
        {!telaGrande && (
          <div className="ml-auto">
            <NotificationBell />
          </div>
        )}
      </header>

      {/* Fundo escuro do menu no celular: tocar fora fecha */}
      {menuAberto && (
        <button
          type="button"
          onClick={() => setMenuAbertoEm(null)}
          aria-label="Fechar menu"
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
        />
      )}

      <Sidebar aberto={menuAberto} mostrarSino={telaGrande} />

      <main className="min-h-screen md:pl-24">
        <Outlet />
      </main>
    </div>
  );
}
