import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Bell,
  Clock,
  DollarSign,
  Loader2,
  MessageCircle,
  Package,
} from "lucide-react";
import {
  listNotificacoes,
  type ListaNotificacoes,
  type Notificacao,
} from "../../services/notificacoes";
import { buildRevisaoWhatsAppLink } from "../../lib/whatsapp";

function IconeNotificacao({ tipo }: { tipo: Notificacao["tipo"] }) {
  if (tipo === "REVISAO_VENCIDA") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
        <AlertTriangle size={17} />
      </div>
    );
  }
  if (tipo === "PAGAMENTO_ATRASADO") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
        <DollarSign size={17} />
      </div>
    );
  }
  if (tipo === "REVISAO_PROXIMA") {
    return (
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 text-amber-400">
        <Clock size={17} />
      </div>
    );
  }
  return (
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#FF7518]/15 text-[#FF7518]">
      <Package size={17} />
    </div>
  );
}

export default function NotificationBell() {
  const [aberto, setAberto] = useState(false);
  const [dados, setDados] = useState<ListaNotificacoes | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(false);
      setDados(await listNotificacoes());
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, []);

  // Atualiza ao abrir o sistema
  useEffect(() => {
    let ativo = true;

    listNotificacoes()
      .then((lista) => {
        if (ativo) setDados(lista);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });

    return () => {
      ativo = false;
    };
  }, []);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!aberto) return;

    function aoClicar(e: MouseEvent) {
      if (raiz.current && !raiz.current.contains(e.target as Node)) {
        setAberto(false);
      }
    }
    function aoTeclar(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(false);
    }

    document.addEventListener("mousedown", aoClicar);
    document.addEventListener("keydown", aoTeclar);
    return () => {
      document.removeEventListener("mousedown", aoClicar);
      document.removeEventListener("keydown", aoTeclar);
    };
  }, [aberto]);

  function alternar() {
    // Atualiza também ao abrir o sino
    if (!aberto) carregar();
    setAberto((atual) => !atual);
  }

  const total = dados?.total ?? 0;
  const lista = dados?.notificacoes ?? [];

  return (
    <div ref={raiz} className="absolute -right-2 -top-3">
      <button
        type="button"
        onClick={alternar}
        aria-label={
          total > 0 ? `Notificações (${total} pendentes)` : "Notificações"
        }
        aria-expanded={aberto}
        className="relative flex h-7 w-7 items-center justify-center rounded-full bg-[#1F1F1F] text-gray-300 ring-1 ring-[#3a3a3a] transition hover:text-white"
      >
        <Bell size={14} />
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed bottom-4 left-28 z-50 w-96 max-w-[calc(100vw-8rem)] overflow-hidden rounded-2xl bg-[#1F1F1F] text-left shadow-2xl ring-1 ring-white/10">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">Notificações</p>
            {carregando && (
              <Loader2 size={14} className="animate-spin text-gray-500" />
            )}
          </div>

          <div className="max-h-[min(28rem,70vh)] overflow-y-auto [color-scheme:dark]">
            {erro && lista.length === 0 ? (
              <p className="p-6 text-center text-sm text-red-400">
                Não foi possível carregar as notificações.
              </p>
            ) : lista.length === 0 ? (
              <p className="p-6 text-center text-sm text-gray-400">
                {carregando
                  ? "Carregando..."
                  : "Nada precisa de atenção agora."}
              </p>
            ) : (
              <ul>
                {lista.map((n) => (
                  <li
                    key={n.id}
                    className="flex items-start gap-2 border-b border-white/5 px-4 py-3 last:border-0 hover:bg-[#292929]"
                  >
                    <Link
                      to={n.link}
                      onClick={() => setAberto(false)}
                      className="flex min-w-0 flex-1 items-start gap-3"
                    >
                      <IconeNotificacao tipo={n.tipo} />
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white">
                          {n.titulo}
                        </p>
                        <p className="text-xs text-gray-400">{n.descricao}</p>
                      </div>
                    </Link>

                    {n.revisao && (
                      <a
                        href={buildRevisaoWhatsAppLink(n.revisao)}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Avisar o cliente pelo WhatsApp"
                        aria-label={`Avisar ${n.revisao.cliente_nome} pelo WhatsApp`}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      >
                        <MessageCircle size={15} />
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}