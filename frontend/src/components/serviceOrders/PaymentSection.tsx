import { useEffect, useState } from "react";
import { Loader2, Plus, Undo2, Wallet } from "lucide-react";
import PaymentStatusBadge from "../ui/PaymentStatusBadge";
import PaymentModal, { type PaymentPayload } from "./PaymentModal";
import {
  estornarPagamento,
  formaPagamentoLabel,
  listarPagamentos,
  registrarPagamento,
  type Pagamento,
  type ServiceOrder,
} from "../../services/serviceOrders";
import { mensagemDeErro } from "../../lib/errors";

interface PaymentSectionProps {
  ordem: ServiceOrder;
  // Funcionário vê só o status; valores e ações são do proprietário
  isProprietario: boolean;
  onOrdemAtualizada: (ordem: ServiceOrder) => void;
}

function formatCurrency(value: string | number) {
  return Number(value)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function PaymentSection({
  ordem,
  isProprietario,
  onOrdemAtualizada,
}: PaymentSectionProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[] | null>(null);
  const [erroLista, setErroLista] = useState<string | null>(null);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  const [confirmandoEstornoId, setConfirmandoEstornoId] = useState<
    string | null
  >(null);
  const [estornandoId, setEstornandoId] = useState<string | null>(null);
  const [erroEstorno, setErroEstorno] = useState<string | null>(null);

  // Recarrega a lista sempre que o valor pago muda (registro ou estorno)
  useEffect(() => {
    if (!isProprietario) return;
    let ativo = true;

    listarPagamentos(ordem.id)
      .then((data) => {
        if (!ativo) return;
        setPagamentos(data);
        setErroLista(null);
      })
      .catch((err) => {
        if (!ativo) return;
        setErroLista(
          mensagemDeErro(err, "Não foi possível carregar os pagamentos."),
        );
      });

    return () => {
      ativo = false;
    };
  }, [ordem.id, ordem.valor_pago, isProprietario]);

  const valorTotal = Number(ordem.valor_total);
  const valorPago = Number(ordem.valor_pago);
  const saldo = Math.max(valorTotal - valorPago, 0);
  const podeRegistrar = ordem.status === "FINALIZADA" && saldo > 0;

  async function handleRegistrar(payload: PaymentPayload) {
    setSalvando(true);
    setErroModal(null);
    try {
      const atualizada = await registrarPagamento(ordem.id, payload);
      onOrdemAtualizada(atualizada);
      setModalAberto(false);
    } catch (err) {
      setErroModal(mensagemDeErro(err, "Não foi possível registrar o pagamento."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleEstornar(pagamentoId: string) {
    setEstornandoId(pagamentoId);
    setErroEstorno(null);
    try {
      const atualizada = await estornarPagamento(ordem.id, pagamentoId);
      onOrdemAtualizada(atualizada);
      setConfirmandoEstornoId(null);
    } catch (err) {
      setErroEstorno(mensagemDeErro(err, "Não foi possível estornar o pagamento."));
    } finally {
      setEstornandoId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Pagamento</p>
            <p className="text-xs text-gray-500">
              Situação do recebimento desta OS
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <PaymentStatusBadge status={ordem.status_pagamento} />
          {isProprietario && podeRegistrar && (
            <button
              type="button"
              onClick={() => {
                setErroModal(null);
                setModalAberto(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f]"
            >
              <Plus size={15} />
              Registrar pagamento
            </button>
          )}
        </div>
      </div>

      {isProprietario && (
        <>
          <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Valor da OS
              </p>
              <p className="mt-1 text-lg font-semibold text-[#1F1F1F]">
                {formatCurrency(valorTotal)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Valor pago
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-600">
                {formatCurrency(valorPago)}
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-400">
                Saldo
              </p>
              <p
                className={`mt-1 text-lg font-semibold ${saldo > 0 ? "text-red-500" : "text-[#1F1F1F]"}`}
              >
                {formatCurrency(saldo)}
              </p>
            </div>
          </div>

          {erroEstorno && (
            <p className="mx-5 mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {erroEstorno}
            </p>
          )}

          {erroLista ? (
            <p className="border-t border-gray-100 p-6 text-center text-sm text-red-500">
              {erroLista}
            </p>
          ) : pagamentos === null ? (
            <div className="flex items-center justify-center gap-2 border-t border-gray-100 p-6 text-sm text-gray-500">
              <Loader2 size={15} className="animate-spin" />
              Carregando pagamentos...
            </div>
          ) : pagamentos.length === 0 ? (
            <p className="border-t border-gray-100 p-6 text-center text-sm text-gray-400">
              Nenhum pagamento registrado.
            </p>
          ) : (
            <ul className="divide-y divide-gray-50 border-t border-gray-100">
              {pagamentos.map((p) => (
                <li
                  key={p.id}
                  className="flex flex-col gap-2 px-5 py-3 text-sm sm:flex-row sm:items-center sm:justify-between"
                >
                  <div
                    className={`flex items-center gap-3 ${p.estornado ? "text-gray-400 line-through" : "text-[#1F1F1F]"}`}
                  >
                    <span className="w-24 text-gray-500">
                      {formatDate(p.data)}
                    </span>
                    <span>{formaPagamentoLabel(p.forma_pagamento)}</span>
                    <span className="font-medium">
                      {formatCurrency(p.valor)}
                    </span>
                  </div>

                  {p.estornado ? (
                    <span className="text-xs font-medium text-gray-400">
                      Estornado
                    </span>
                  ) : confirmandoEstornoId === p.id ? (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">
                        Estornar este pagamento?
                      </span>
                      <button
                        type="button"
                        onClick={() => setConfirmandoEstornoId(null)}
                        disabled={estornandoId === p.id}
                        className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
                      >
                        Não
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEstornar(p.id)}
                        disabled={estornandoId === p.id}
                        className="flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                      >
                        {estornandoId === p.id && (
                          <Loader2 size={12} className="animate-spin" />
                        )}
                        Confirmar estorno
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setErroEstorno(null);
                        setConfirmandoEstornoId(p.id);
                      }}
                      className="flex items-center gap-1.5 self-start rounded-lg px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 sm:self-auto"
                    >
                      <Undo2 size={13} />
                      Estornar
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {modalAberto && (
        <PaymentModal
          ordemId={ordem.id}
          saldo={saldo}
          submitting={salvando}
          erro={erroModal}
          onClose={() => setModalAberto(false)}
          onSave={handleRegistrar}
        />
      )}
    </div>
  );
}
