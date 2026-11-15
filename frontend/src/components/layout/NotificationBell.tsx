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
  RotateCcw,
  X,
} from "lucide-react";
import {
  listNotificacoes,
  type ListaNotificacoes,
  type Notificacao,
} from "../../services/notificacoes";
import { buildRevisaoWhatsAppLink } from "../../lib/whatsapp";
import { useAuth } from "../../contexts/AuthContext";
import {
  estaDispensada,
  lerDispensadas,
  limparResolvidas,
  salvarDispensadas,
} from "../../lib/notificacoesDispensadas";

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

  // Dispensadas no X ficam guardadas por usuário, neste navegador
  const { user } = useAuth();
  const usuarioId = user?.id ?? 0;
  const [dispensadas, setDispensadas] = useState(() => lerDispensadas(usuarioId));
  const [verDispensadas, setVerDispensadas] = useState(false);

  // Chegou a lista nova: esquece as dispensadas já resolvidas, pra que
  // voltem a aparecer se o problema acontecer de novo
  const receberLista = useCallback(
    (lista: ListaNotificacoes) => {
      setDados(lista);
      const atualizadas = limparResolvidas(
        lerDispensadas(usuarioId),
        lista.notificacoes,
      );
      salvarDispensadas(usuarioId, atualizadas);
      setDispensadas(atualizadas);
    },
    [usuarioId],
  );

  function dispensar(n: Notificacao) {
    const atualizadas = { ...dispensadas, [n.id]: n.tipo };
    salvarDispensadas(usuarioId, atualizadas);
    setDispensadas(atualizadas);
  }

  function restaurar(n: Notificacao) {
    const atualizadas = { ...dispensadas };
    delete atualizadas[n.id];
    salvarDispensadas(usuarioId, atualizadas);
    setDispensadas(atualizadas);
  }

  const carregar = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(false);
      receberLista(await listNotificacoes());
    } catch {
      setErro(true);
    } finally {
      setCarregando(false);
    }
  }, [receberLista]);

  // Atualiza ao abrir o sistema
  useEffect(() => {
    let ativo = true;

    listNotificacoes()
      .then((lista) => {
        if (ativo) receberLista(lista);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });

    return () => {
      ativo = false;
    };
  }, [receberLista]);

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

  const todas = dados?.notificacoes ?? [];
  const pendentes = todas.filter((n) => !estaDispensada(n, dispensadas));
  const escondidas = todas.filter((n) => estaDispensada(n, dispensadas));
  // O número do sino conta só o que não foi dispensado
  const total = pendentes.length;
  const lista = verDispensadas ? escondidas : pendentes;

  return (
    <div ref={raiz} className="relative md:absolute md:-right-2 md:-top-3">
      <button
        type="button"
        onClick={alternar}
        aria-label={
          total > 0 ? `Notificações (${total} pendentes)` : "Notificações"
        }
        aria-expanded={aberto}
        className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#1F1F1F] text-gray-300 ring-1 ring-[#3a3a3a] transition hover:text-white md:h-7 md:w-7"
      >
        <Bell size={14} />
        {total > 0 && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {aberto && (
        <div className="fixed left-3 right-3 top-16 z-50 overflow-hidden rounded-2xl bg-[#1F1F1F] text-left shadow-2xl ring-1 ring-white/10 md:bottom-4 md:left-28 md:right-auto md:top-auto md:w-96 md:max-w-[calc(100vw-8rem)]">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-semibold text-white">
              {verDispensadas ? "Dispensadas" : "Notificações"}
            </p>
            <div className="flex items-center gap-3">
              {carregando && (
                <Loader2 size={14} className="animate-spin text-gray-500" />
              )}
              {(escondidas.length > 0 || verDispensadas) && (
                <button
                  type="button"
                  onClick={() => setVerDispensadas((v) => !v)}
                  className="text-xs font-medium text-gray-400 hover:text-white"
                >
                  {verDispensadas
                    ? "Voltar"
                    : `Ver dispensadas (${escondidas.length})`}
                </button>
              )}
            </div>
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
                  : verDispensadas
                    ? "Nenhuma notificação dispensada."
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

                    {verDispensadas ? (
                      <button
                        type="button"
                        onClick={() => restaurar(n)}
                        title="Voltar a mostrar"
                        aria-label="Voltar a mostrar esta notificação"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-white"
                      >
                        <RotateCcw size={14} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => dispensar(n)}
                        title="Dispensar (volta se piorar ou acontecer de novo)"
                        aria-label="Dispensar notificação"
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-500 hover:bg-white/10 hover:text-white"
                      >
                        <X size={15} />
                      </button>
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