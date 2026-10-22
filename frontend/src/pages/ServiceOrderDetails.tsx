import { useState, useEffect, useMemo } from "react";
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
  FileDown,
  CheckCircle2,
  Ban,
  Check,
  StickyNote,
  Plus,
  PackageSearch,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import { listStock, type StockItem } from "../services/stock";
import {
  getServiceOrderById,
  changeServiceOrderStatus,
  updateServiceOrderDetalhes,
  addServiceToOrder,
  addPartToOrder,
  removeServiceFromOrder,
  removePartFromOrder,
  type ServiceOrder,
} from "../services/serviceOrders";
import ServicoRow from "../components/serviceOrders/ServicoRow";
import PecaRow from "../components/serviceOrders/PecaRow";
import { buildWhatsAppLink } from "../lib/whatsapp";
import PagamentosCard from "../components/serviceOrders/PagamentosCard";
import { useAuth } from "../contexts/AuthContext";
import { formatPercent } from "../lib/relatorios";
import { mensagemDeErro } from "../lib/errors";

const plainInputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3 py-2.5 text-base text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA] md:text-sm";

type ServicoItem = ServiceOrder["servicos"][number];
type PecaItem = ServiceOrder["pecas"][number];

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

// Valores do formulário de detalhes a partir da OS salva
// (a previsão vem como meio-dia de Brasília, então os 10 primeiros caracteres são o dia)
function detalhesDaOrdem(ordem: ServiceOrder | null) {
  return {
    reclamacao: ordem?.reclamacao ?? "",
    observacoes: ordem?.observacoes ?? "",
    previsao_entrega: ordem?.previsao_entrega?.slice(0, 10) ?? "",
  };
}

function formatDateTime(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

// function buildWhatsAppLink(order: ServiceOrder) {
//   const digits = (order.cliente?.telefone || "").replace(/\D/g, "");
//   const comDDI = digits.length > 11 ? digits : `55${digits}`;

//   const linhasServicos = order.servicos
//     .map((s) => `- ${s.descricao}: ${formatCurrency(s.valor)}`)
//     .join("\n");

//   const linhasPecas = order.pecas
//     .map(
//       (p) =>
//         `- ${p.item_estoque.nome} (x${p.quantidade}): ${formatCurrency(Number(p.valor_unitario) * p.quantidade)}`,
//     )
//     .join("\n");

//   const mensagem = `Olá ${order.cliente?.nome}!\n\nSegue o orçamento da sua *OS #${order.id}*.\nVeículo: *${order.veiculo?.marca} ${order.veiculo?.modelo}*.\n\n*Serviços:*\n${linhasServicos || "Nenhum serviço."}\n\n*Peças:*\n${linhasPecas || "Nenhuma peça."}\n\n*Valor total: ${formatCurrency(order.valor_total)}*`;

//   return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
// }

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <label className="text-xs font-semibold text-[#1B2130]">{label}</label>
      {children}
    </div>
  );
}

/// AQUI JAZ A FUNCAO SERVICOROW E PECAROW

export default function ServiceOrderDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const orderId = Number(id);

  const [ordem, setOrdem] = useState<ServiceOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processando, setProcessando] = useState(false);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [gerandoPdf, setGerandoPdf] = useState(false);

  const [stockItems, setStockItems] = useState<StockItem[]>([]);

  // Reclamação, previsão de entrega e informações ao cliente: salvos juntos
  const [detalhes, setDetalhes] = useState(detalhesDaOrdem(null));
  const [savingDetalhes, setSavingDetalhes] = useState(false);
  const [erroDetalhes, setErroDetalhes] = useState<string | null>(null);

  const [descricaoServico, setDescricaoServico] = useState("");
  const [valorServico, setValorServico] = useState("");
  const [addingServico, setAddingServico] = useState(false);
  const [erroServico, setErroServico] = useState<string | null>(null);
  const [savingServicoId, setSavingServicoId] = useState<number | null>(null);

  const [itemEstoqueId, setItemEstoqueId] = useState<number | "">("");
  const [quantidadePeca, setQuantidadePeca] = useState("");
  const [addingPeca, setAddingPeca] = useState(false);
  const [erroPeca, setErroPeca] = useState<string | null>(null);
  const [savingPecaId, setSavingPecaId] = useState<number | null>(null);

  // Trocou de OS (link de uma OS pra outra): volta pro carregando na hora
  const [ordemAnterior, setOrdemAnterior] = useState(orderId);
  if (orderId !== ordemAnterior) {
    setOrdemAnterior(orderId);
    setLoading(true);
    setError(null);
  }

  async function atualizarOrdem() {
    try {
      setOrdem(await getServiceOrderById(orderId));
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => {
    if (Number.isNaN(orderId)) return;
    // Resposta de uma OS antiga não sobrescreve a atual
    let ativo = true;

    getServiceOrderById(orderId)
      .then((data) => {
        if (!ativo) return;
        setOrdem(data);
        setDetalhes(detalhesDaOrdem(data));
      })
      .catch((err) => {
        console.error(err);
        if (ativo) setError("Não foi possível carregar esta ordem de serviço.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    listStock()
      .then((itens) => {
        if (ativo) setStockItems(itens);
      })
      .catch((err) => {
        console.error(err);
        if (ativo) setStockItems([]);
      });

    return () => {
      ativo = false;
    };
  }, [orderId]);

  const itemEstoqueSelecionado = useMemo(
    () => stockItems.find((i) => i.id === itemEstoqueId) ?? null,
    [stockItems, itemEstoqueId],
  );

  const salvos = detalhesDaOrdem(ordem);
  const detalhesDirty =
    detalhes.reclamacao.trim() !== salvos.reclamacao ||
    detalhes.observacoes.trim() !== salvos.observacoes ||
    detalhes.previsao_entrega !== salvos.previsao_entrega;

  async function handleSaveDetalhes() {
    if (!ordem) return;
    setSavingDetalhes(true);
    setErroDetalhes(null);
    try {
      const atualizada = await updateServiceOrderDetalhes(ordem.id, {
        reclamacao: detalhes.reclamacao.trim(),
        observacoes: detalhes.observacoes.trim(),
        previsao_entrega: detalhes.previsao_entrega,
      });
      setOrdem(atualizada);
      setDetalhes(detalhesDaOrdem(atualizada));
    } catch (err) {
      setErroDetalhes(mensagemDeErro(err, "Erro ao salvar os detalhes."));
    } finally {
      setSavingDetalhes(false);
    }
  }

  async function handleAddServico() {
    if (!ordem) return;
    const valorNumero = Number(valorServico.replace(",", "."));
    if (!descricaoServico.trim() || !valorNumero || valorNumero <= 0) {
      setErroServico("Preencha a descrição e um valor maior que zero.");
      return;
    }
    setAddingServico(true);
    setErroServico(null);
    try {
      const atualizada = await addServiceToOrder(ordem.id, {
        descricao: descricaoServico.trim(),
        valor: valorNumero,
      });
      setOrdem(atualizada);
      setDescricaoServico("");
      setValorServico("");
    } catch (err) {
      setErroServico(mensagemDeErro(err, "Erro ao adicionar serviço."));
    } finally {
      setAddingServico(false);
    }
  }

  async function handleRemoveServico(servicoId: number) {
    if (!ordem) return;
    setSavingServicoId(servicoId);
    try {
      const atualizada = await removeServiceFromOrder(ordem.id, servicoId);
      setOrdem(atualizada);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover serviço.");
    } finally {
      setSavingServicoId(null);
    }
  }

  async function handleUpdateServico(
    servico: ServicoItem,
    novaDescricao: string,
    novoValor: number,
  ) {
    if (!ordem) return;
    if (
      novaDescricao === servico.descricao &&
      novoValor === Number(servico.valor)
    )
      return;

    setSavingServicoId(servico.id);
    try {
      await removeServiceFromOrder(ordem.id, servico.id);
    } catch (err) {
      console.error(err);
      alert(
        "Não foi possível remover o serviço para editar. Nada foi alterado.",
      );
      setSavingServicoId(null);
      return;
    }
    try {
      const atualizada = await addServiceToOrder(ordem.id, {
        descricao: novaDescricao,
        valor: novoValor,
      });
      setOrdem(atualizada);
    } catch (err) {
      console.error(err);
      try {
        const restaurada = await addServiceToOrder(ordem.id, {
          descricao: servico.descricao,
          valor: Number(servico.valor),
        });
        setOrdem(restaurada);
        alert(
          "Não foi possível salvar a alteração. O serviço original foi restaurado.",
        );
      } catch (err2) {
        console.error(err2);
        alert(
          `Erro grave: o serviço "${servico.descricao}" foi removido e não pôde ser restaurado.`,
        );
      }
    } finally {
      setSavingServicoId(null);
    }
  }

  async function handleAddPeca() {
    if (!ordem || !itemEstoqueId) {
      setErroPeca("Selecione uma peça do estoque.");
      return;
    }
    const quantidadeNumero = Number(quantidadePeca);
    if (!quantidadeNumero || quantidadeNumero <= 0) {
      setErroPeca("Informe uma quantidade maior que zero.");
      return;
    }
    setAddingPeca(true);
    setErroPeca(null);
    try {
      const resultado = await addPartToOrder(ordem.id, {
        item_estoque_id: Number(itemEstoqueId),
        quantidade: quantidadeNumero,
      });
      setOrdem(resultado.ordem);
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === Number(itemEstoqueId)
            ? { ...item, quantidade: resultado.estoque_restante }
            : item,
        ),
      );
      setItemEstoqueId("");
      setQuantidadePeca("");
    } catch (err) {
      setErroPeca(
        mensagemDeErro(
          err,
          "Erro ao adicionar peça — verifique o estoque disponível.",
        ),
      );
    } finally {
      setAddingPeca(false);
    }
  }

  async function handleRemovePeca(peca: PecaItem) {
    if (!ordem) return;
    setSavingPecaId(peca.id);
    try {
      const atualizada = await removePartFromOrder(ordem.id, peca.id);
      setOrdem(atualizada);
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === peca.item_estoque.id
            ? { ...item, quantidade: item.quantidade + peca.quantidade }
            : item,
        ),
      );
    } catch (err) {
      console.error(err);
      alert("Erro ao remover peça.");
    } finally {
      setSavingPecaId(null);
    }
  }

  async function handleUpdatePecaQuantidade(
    peca: PecaItem,
    novaQuantidade: number,
  ) {
    if (!ordem) return;
    if (novaQuantidade === peca.quantidade) return;

    setSavingPecaId(peca.id);
    try {
      await removePartFromOrder(ordem.id, peca.id);
    } catch (err) {
      console.error(err);
      alert("Não foi possível remover a peça para editar. Nada foi alterado.");
      setSavingPecaId(null);
      return;
    }
    try {
      const resultado = await addPartToOrder(ordem.id, {
        item_estoque_id: peca.item_estoque.id,
        quantidade: novaQuantidade,
      });
      setOrdem(resultado.ordem);
      setStockItems((prev) =>
        prev.map((item) =>
          item.id === peca.item_estoque.id
            ? { ...item, quantidade: resultado.estoque_restante }
            : item,
        ),
      );
    } catch (err) {
      console.error(err);
      try {
        const restaurado = await addPartToOrder(ordem.id, {
          item_estoque_id: peca.item_estoque.id,
          quantidade: peca.quantidade,
        });
        setOrdem(restaurado.ordem);
        alert(
          "Estoque insuficiente para essa quantidade. A quantidade original foi restaurada.",
        );
      } catch (err2) {
        console.error(err2);
        alert(
          `Erro grave: a peça "${peca.item_estoque.nome}" foi removida e não pôde ser restaurada.`,
        );
      }
    } finally {
      setSavingPecaId(null);
    }
  }

  async function handleEncerrar() {
    if (!ordem) return;
    if (
      !confirm(
        "Encerrar esta ordem de serviço?",
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
    } catch (err) {
      setErroAcao(mensagemDeErro(err, "Erro ao encerrar a ordem de serviço."));
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
    } catch (err) {
      setErroAcao(mensagemDeErro(err, "Erro ao cancelar a ordem de serviço."));
    } finally {
      setProcessando(false);
    }
  }

  async function handleReabrir() {
    if (!ordem) return;
    if (
      !confirm(
        "Reabrir esta ordem de serviço? Os pagamentos registrados continuam valendo.",
      )
    )
      return;
    setProcessando(true);
    setErroAcao(null);
    try {
      const reaberta = await changeServiceOrderStatus(ordem.id, "EM_ANDAMENTO");
      setOrdem(reaberta);
    } catch (err) {
      setErroAcao(mensagemDeErro(err, "Erro ao reabrir a ordem de serviço."));
    } finally {
      setProcessando(false);
    }
  }

  async function handleBaixarPdf() {
    if (!ordem) return;
    setGerandoPdf(true);
    setErroAcao(null);
    try {
      // O jspdf é pesado: só é carregado quando alguém pede o PDF
      const { baixarPdfOrdemServico } = await import("../lib/pdfOrdemServico");
      await baixarPdfOrdemServico(ordem);
    } catch (err) {
      console.error(err);
      setErroAcao("Não foi possível gerar o PDF.");
    } finally {
      setGerandoPdf(false);
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
  const podeReabrir = ordem.status === "FINALIZADA";
  // O backend só manda a margem para o proprietário
  const margem = ordem.margem_pecas;

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex flex-col items-start gap-3 md:flex-row md:justify-between md:gap-0">
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
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 md:flex-nowrap md:gap-0">
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
              {ordem.veiculo?.cor && ` · ${ordem.veiculo.cor}`}
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
        {!podeAgir && (
          <p className="border-t border-gray-100 bg-gray-50 px-5 py-3 text-xs text-gray-500">
            Esta OS está{" "}
            {ordem.status === "FINALIZADA" ? "finalizada" : "cancelada"}. Reabra
            a ordem para editar serviços, peças ou os detalhes do atendimento.
          </p>
        )}
      </div>

      {/* DETALHES DO ATENDIMENTO */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
            <StickyNote size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">
              Detalhes do atendimento
            </p>
            <p className="text-xs text-gray-500">
              Aparecem no orçamento do WhatsApp e no PDF entregue ao cliente
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-[1fr_180px]">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Reclamação do cliente
            </label>
            <textarea
              value={detalhes.reclamacao}
              disabled={savingDetalhes || !podeAgir}
              onChange={(e) =>
                setDetalhes((d) => ({ ...d, reclamacao: e.target.value }))
              }
              placeholder="O que o cliente relatou. Ex.: barulho ao frear"
              rows={2}
              className={plainInputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Previsão de entrega
            </label>
            <input
              type="date"
              value={detalhes.previsao_entrega}
              disabled={savingDetalhes || !podeAgir}
              onChange={(e) =>
                setDetalhes((d) => ({ ...d, previsao_entrega: e.target.value }))
              }
              className={plainInputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <label className="text-xs font-semibold text-[#1B2130]">
              Informações ao cliente
            </label>
            <textarea
              value={detalhes.observacoes}
              disabled={savingDetalhes || !podeAgir}
              onChange={(e) =>
                setDetalhes((d) => ({ ...d, observacoes: e.target.value }))
              }
              placeholder="Recomendações e avisos. Ex.: trocar os pneus nos próximos 3 meses"
              rows={2}
              className={plainInputClass}
            />
          </div>
        </div>
        {podeAgir && (detalhesDirty || savingDetalhes) && (
          <div className="flex justify-end gap-2 border-t border-gray-100 px-5 py-3">
            <button
              type="button"
              onClick={() => setDetalhes(salvos)}
              disabled={savingDetalhes}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={handleSaveDetalhes}
              disabled={savingDetalhes}
              className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
            >
              {savingDetalhes ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <Check size={15} />
              )}
              Salvar
            </button>
          </div>
        )}
        {erroDetalhes && (
          <p className="px-5 pb-4 text-sm text-red-500">{erroDetalhes}</p>
        )}
      </div>

      {/* SERVIÇOS */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <Wrench size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Serviços</p>
            <p className="text-xs text-gray-500">
              Serviços realizados nesta OS
            </p>
          </div>
        </div>

        {podeAgir && (
          <>
            <div className="flex flex-col gap-3 bg-gray-50/50 p-5 sm:flex-row sm:items-end">
              <Field label="Descrição do serviço">
                <input
                  type="text"
                  value={descricaoServico}
                  onChange={(e) => setDescricaoServico(e.target.value)}
                  placeholder="Ex: Troca de óleo e filtro"
                  className={plainInputClass}
                />
              </Field>
              <Field label="Valor (R$)">
                <input
                  type="text"
                  inputMode="decimal"
                  value={valorServico}
                  onChange={(e) => setValorServico(e.target.value)}
                  placeholder="0,00"
                  className={`${plainInputClass} sm:w-32`}
                />
              </Field>
              <button
                type="button"
                onClick={handleAddServico}
                disabled={addingServico}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
              >
                <Plus size={15} />
                Adicionar
              </button>
            </div>
            {erroServico && (
              <p className="bg-gray-50/50 px-5 pb-4 text-sm text-red-500">
                {erroServico}
              </p>
            )}
          </>
        )}

        {ordem.servicos.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            Nenhum serviço adicionado.
          </div>
        ) : podeAgir ? (
          <ul className="divide-y divide-gray-50 border-t border-gray-100">
            {ordem.servicos.map((s) => (
              <ServicoRow
                key={s.id}
                servico={s}
                saving={savingServicoId === s.id}
                onSave={(descricao, valor) =>
                  handleUpdateServico(s, descricao, valor)
                }
                onRemove={() => handleRemoveServico(s.id)}
                confirmBeforeSave
              />
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ordem.servicos.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm md:gap-0"
              >
                <span className="text-[#1F1F1F]">{s.descricao}</span>
                <span className="whitespace-nowrap font-medium text-[#1F1F1F] md:whitespace-normal">
                  {formatCurrency(s.valor)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* PEÇAS */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF7518]">
            <PackageSearch size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Peças utilizadas</p>
            <p className="text-xs text-gray-500">
              A quantidade é descontada do estoque assim que a peça é adicionada
            </p>
          </div>
        </div>

        {podeAgir && (
          <>
            <div className="flex flex-col gap-3 bg-gray-50/50 p-5 sm:flex-row sm:items-end">
              <Field label="Peça">
                <select
                  value={itemEstoqueId}
                  onChange={(e) =>
                    setItemEstoqueId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className={plainInputClass}
                >
                  <option value="">Selecione...</option>
                  {stockItems.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                      disabled={item.quantidade === 0}
                    >
                      {item.nome} (disponível: {item.quantidade})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Quantidade">
                <input
                  type="number"
                  min={1}
                  max={itemEstoqueSelecionado?.quantidade ?? undefined}
                  value={quantidadePeca}
                  onChange={(e) => setQuantidadePeca(e.target.value)}
                  className={`${plainInputClass} sm:w-28`}
                />
              </Field>
              <button
                type="button"
                onClick={handleAddPeca}
                disabled={addingPeca}
                className="flex items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
              >
                <Plus size={15} />
                Adicionar
              </button>
            </div>
            {stockItems.length === 0 && (
              <p className="flex items-center gap-1.5 bg-gray-50/50 px-5 pb-4 text-xs text-amber-600">
                <AlertTriangle size={13} />
                Não foi possível carregar a lista de peças do estoque.
              </p>
            )}
            {erroPeca && (
              <p className="flex items-center gap-1.5 bg-gray-50/50 px-5 pb-4 text-sm text-red-500">
                <AlertTriangle size={14} />
                {erroPeca}
              </p>
            )}
          </>
        )}

        {ordem.pecas.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-400">
            Nenhuma peça utilizada.
          </div>
        ) : podeAgir ? (
          <ul className="divide-y divide-gray-50 border-t border-gray-100">
            {ordem.pecas.map((p) => (
              <PecaRow
                key={p.id}
                peca={p}
                saving={savingPecaId === p.id}
                onSaveQuantidade={(novaQuantidade) =>
                  handleUpdatePecaQuantidade(p, novaQuantidade)
                }
                onRemove={() => handleRemovePeca(p)}
                confirmBeforeSave
              />
            ))}
          </ul>
        ) : (
          <ul className="divide-y divide-gray-50">
            {ordem.pecas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm md:gap-0"
              >
                <span className="text-[#1F1F1F]">
                  {p.item_estoque.nome}{" "}
                  <span className="text-gray-400">x{p.quantidade}</span>
                </span>
                <span className="whitespace-nowrap font-medium text-[#1F1F1F] md:whitespace-normal">
                  {formatCurrency(Number(p.valor_unitario) * p.quantidade)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* CUSTO E MARGEM DAS PEÇAS (só proprietário) */}
      {margem && ordem.pecas.length > 0 && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">
                Custo e margem das peças
              </p>
              <p className="text-xs text-gray-500">
                Custo do estoque no momento em que a peça entrou na OS
              </p>
            </div>
          </div>
          {margem.pecas_com_custo === 0 ? (
            <p className="p-5 text-sm text-gray-500">
              Sem custo registrado nas peças desta OS.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-6 p-5 sm:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Custo das peças
                </p>
                <p className="mt-1 text-lg font-semibold text-[#1F1F1F]">
                  {formatCurrency(margem.custo)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Margem (R$)
                </p>
                <p className="mt-1 text-lg font-semibold text-[#1F1F1F]">
                  {formatCurrency(margem.margem)}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Margem (%)
                </p>
                <p className="mt-1 text-lg font-semibold text-[#1F1F1F]">
                  {margem.percentual === null
                    ? "—"
                    : formatPercent(Number(margem.percentual))}
                </p>
              </div>
            </div>
          )}
          {margem.pecas_sem_custo > 0 && margem.pecas_com_custo > 0 && (
            <p className="flex items-center gap-1.5 border-t border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-700">
              <AlertTriangle size={13} className="shrink-0" />
              {margem.pecas_sem_custo === 1
                ? "1 peça sem custo registrado ficou"
                : `${margem.pecas_sem_custo} peças sem custo registrado ficaram`}{" "}
              fora da margem ({formatCurrency(margem.valor_sem_custo)} em
              venda).
            </p>
          )}
          <ul className="divide-y divide-gray-50 border-t border-gray-100">
            {ordem.pecas.map((p) => (
              <li
                key={p.id}
                className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
              >
                <span className="text-[#1F1F1F]">
                  {p.item_estoque.nome}{" "}
                  <span className="text-gray-400">x{p.quantidade}</span>
                </span>
                {p.valor_custo == null ? (
                  <span className="text-xs text-gray-400">
                    sem custo registrado
                  </span>
                ) : (
                  <span className="whitespace-nowrap text-gray-600 md:whitespace-normal">
                    custo {formatCurrency(Number(p.valor_custo) * p.quantidade)}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* A key remonta o card ao finalizar, para o valor já vir com o saldo final */}
      <PagamentosCard
        key={ordem.status}
        ordem={ordem}
        podeGerenciar={user?.perfil === "PROPRIETARIO"}
        onAlterado={atualizarOrdem}
      />

      {erroAcao && (
        <p className="rounded-xl bg-red-50 p-4 text-sm text-red-600">
          {erroAcao}
        </p>
      )}

      <div className="flex flex-col items-stretch justify-between gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Valor total da OS
          </p>
          <p className="text-2xl font-semibold text-[#1F1F1F]">
            {formatCurrency(ordem.valor_total)}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-2 md:flex-row md:flex-wrap md:items-center">
          {/* Cliente com dados removidos (LGPD) não tem telefone pra mandar */}
          {ordem.cliente?.telefone && (
            <a
              href={buildWhatsAppLink(ordem)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-700 hover:bg-emerald-100 md:justify-start"
            >
              <MessageCircle size={16} />
              Enviar por WhatsApp
            </a>
          )}
          {/* OS cancelada não tem o que entregar ao cliente */}
          {ordem.status !== "CANCELADA" && (
            <button
              type="button"
              onClick={handleBaixarPdf}
              disabled={gerandoPdf}
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60 md:justify-start"
            >
              {gerandoPdf ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <FileDown size={16} />
              )}
              Baixar PDF
            </button>
          )}
          {podeAgir && (
            <button
              type="button"
              onClick={handleCancelar}
              disabled={processando}
              className="flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-60 md:justify-start"
            >
              <Ban size={16} />
              Cancelar OS
            </button>
          )}
          {podeReabrir && (
            <button
              type="button"
              onClick={handleReabrir}
              disabled={processando}
              className="flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-60 md:justify-start"
            >
              {processando ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Wrench size={16} />
              )}
              Reabrir OS
            </button>
          )}
          {podeAgir && (
            <button
              type="button"
              onClick={handleEncerrar}
              disabled={processando}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60 md:justify-start"
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
