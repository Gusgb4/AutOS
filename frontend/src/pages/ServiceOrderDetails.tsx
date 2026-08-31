import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft,
  User,
  Phone,
  Car,
  Hash,
  Wrench,
  Loader2,
  MessageCircle,
  CheckCircle2,
  Ban,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import {
  getServiceOrderById,
  changeServiceOrderStatus,
  type ServiceOrder,
} from "../services/serviceOrders";

function formatCurrency(value: string | number) {
  return Number(value)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function capitalizeName(nome: string) {
  return nome
    .toLowerCase()
    .split(" ")
    .filter(Boolean)
    .map((palavra) => palavra.charAt(0).toUpperCase() + palavra.slice(1))
    .join(" ");
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

function apiErrorMessage(err: any, fallback: string) {
  return (
    err?.response?.data?.erro ||
    err?.response?.data?.error ||
    err?.response?.data?.errors?.[0]?.message ||
    fallback
  );
}

function buildWhatsAppLink(order: ServiceOrder) {
  const digits = (order.cliente?.telefone || "").replace(/\D/g, "");
  const comDDI = digits.length > 11 ? digits : `55${digits}`;

  const linhasServicos = order.servicos
    .map((s) => `- ${s.descricao}: ${formatCurrency(s.valor)}`)
    .join("\n");

  const linhasPecas = order.pecas
    .map(
      (p) =>
        `- ${p.item_estoque.nome} (x${p.quantidade}): ${formatCurrency(Number(p.valor_unitario) * p.quantidade)}`,
    )
    .join("\n");

  const mensagem = `Olá ${order.cliente?.nome}!\n\nSegue o orçamento da sua *OS #${order.id}*.\nVeículo: *${order.veiculo?.marca} ${order.veiculo?.modelo}*.\n\n*Serviços:*\n${linhasServicos || "Nenhum serviço."}\n\n*Peças:*\n${linhasPecas || "Nenhuma peça."}\n\n*Valor total: ${formatCurrency(order.valor_total)}*`;

  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
}

export default function ServiceOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const orderId = Number(id);

  const [ordem, setOrdem] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

  const fetchOrdem = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getServiceOrderById(orderId);
      setOrdem(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar esta ordem de serviço.");
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (!Number.isNaN(orderId)) fetchOrdem();
  }, [orderId, fetchOrdem]);

  async function handleEncerrar() {
    if (!ordem) return;
    if (
      !confirm(
        "Encerrar esta ordem de serviço? Essa ação não pode ser desfeita.",
      )
    )
      return;

    setProcessando(true);
    setErroAcao(null);
    try {
      let atual = ordem;
      if (atual.status === "ABERTA") {
        atual = await changeServiceOrderStatus(ordem.id, "EM_ANDAMENTO");
      }
      const finalizada = await changeServiceOrderStatus(atual.id, "FINALIZADA");
      setOrdem(finalizada);
    } catch (err: any) {
      setErroAcao(apiErrorMessage(err, "Erro ao encerrar a ordem de serviço."));
    } finally {
      setProcessando(false);
    }
  }

  async function handleCancelar() {
    if (!ordem) return;
    if (
      !confirm(
        "Cancelar esta ordem de serviço? As peças usadas serão devolvidas ao estoque.",
      )
    )
      return;

    setProcessando(true);
    setErroAcao(null);
    try {
      const cancelada = await changeServiceOrderStatus(ordem.id, "CANCELADA");
      setOrdem(cancelada);
    } catch (err: any) {
      setErroAcao(apiErrorMessage(err, "Erro ao cancelar a ordem de serviço."));
    } finally {
      setProcessando(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Carregando ordem de serviço...
      </div>
    );
  }

  if (error || !ordem) {
    return (
      <div className="space-y-4 p-8 text-center">
        <p className="text-sm text-red-500">
          {error ?? "Ordem de serviço não encontrada."}
        </p>
        <Link
          to="/ordens-servico"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar para Ordens de Serviço
        </Link>
      </div>
    );
  }

  const podeAgir = ordem.status === "ABERTA" || ordem.status === "EM_ANDAMENTO";

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">
            OS #{ordem.id}
          </h1>
          <p className="text-sm text-gray-500">
            Aberta em {formatDateTime(ordem.created_at)}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ordens-servico")}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <User size={18} />
            </div>
            <p className="font-semibold text-[#1F1F1F]">
              Cliente, veículo e mecânico
            </p>
          </div>
          <StatusBadge status={ordem.status} />
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Cliente
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
              <User size={14} className="text-gray-400" />
              {ordem.cliente?.nome}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
              <Phone size={12} />
              {ordem.cliente?.telefone}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Veículo
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
              <Car size={14} className="text-gray-400" />
              {ordem.veiculo?.marca} {ordem.veiculo?.modelo}
            </p>
            <p className="mt-1.5 flex items-center gap-2 text-xs text-gray-400">
              <Hash size={12} />
              {ordem.veiculo?.placa}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">
              Mecânico responsável
            </p>
            <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
              <Wrench size={14} className="text-gray-400" />
              {ordem.mecanico?.nome ? capitalizeName(ordem.mecanico.nome) : "—"}
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <p className="font-semibold text-[#1F1F1F]">Serviços</p>
        </div>
        {ordem.servicos.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            Nenhum serviço adicionado.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ordem.servicos.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="text-[#1F1F1F]">{s.descricao}</span>
                <span className="font-medium text-[#1F1F1F]">
                  {formatCurrency(s.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <p className="font-semibold text-[#1F1F1F]">Peças utilizadas</p>
        </div>
        {ordem.pecas.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            Nenhuma peça utilizada.
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ordem.pecas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between px-5 py-3 text-sm"
              >
                <span className="text-[#1F1F1F]">
                  {p.item_estoque.nome}{" "}
                  <span className="text-gray-400">x{p.quantidade}</span>
                </span>
                <span className="font-medium text-[#1F1F1F]">
                  {formatCurrency(Number(p.valor_unitario) * p.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {erroAcao && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {erroAcao}
        </p>
      )}

      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm sm:flex-row sm:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Valor total da OS
          </p>
          <p className="text-2xl font-semibold text-[#1F1F1F]">
            {formatCurrency(ordem.valor_total)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href={buildWhatsAppLink(ordem)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center
          gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5
          text-sm font-medium text-emerald-700 hover:bg-emerald-100"
          >
            <MessageCircle size={16} />
            Enviar por WhatsApp
          </a>
          {podeAgir && (
            <button
              type="button"
              onClick={handleCancelar}
              disabled={processando}
              className="flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
            >
              <Ban size={16} />
              Cancelar OS
            </button>
          )}
          {podeAgir && (
            <button
              type="button"
              onClick={handleEncerrar}
              disabled={processando}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              Encerrar OS
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
