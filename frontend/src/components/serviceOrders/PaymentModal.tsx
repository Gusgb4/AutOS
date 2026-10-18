import { useState, type FormEvent } from "react";
import { Calendar, Check, DollarSign, Wallet, X } from "lucide-react";
import {
  FORMAS_PAGAMENTO,
  type FormaPagamento,
} from "../../services/serviceOrders";

export interface PaymentPayload {
  valor: number;
  forma_pagamento: FormaPagamento;
  data: string;
}

// Montado só enquanto está aberto: o estado inicial já vem com o saldo e a data de hoje
interface PaymentModalProps {
  ordemId: number;
  saldo: number;
  submitting?: boolean;
  erro?: string | null;
  onClose: () => void;
  onSave: (payload: PaymentPayload) => void;
}

// Data local no formato do <input type="date"> (YYYY-MM-DD)
function hoje() {
  const d = new Date();
  const mes = String(d.getMonth() + 1).padStart(2, "0");
  const dia = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mes}-${dia}`;
}

function formatCurrency(value: number) {
  return value
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

export default function PaymentModal({
  ordemId,
  saldo,
  submitting = false,
  erro,
  onClose,
  onSave,
}: PaymentModalProps) {
  const [valor, setValor] = useState(() => saldo.toFixed(2).replace(".", ","));
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [data, setData] = useState(hoje);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    // Aceita "1.234,56" e "1234.56"
    const texto = valor.trim();
    const valorNumero = Number(
      texto.includes(",") ? texto.replace(/\./g, "").replace(",", ".") : texto,
    );
    if (!Number.isFinite(valorNumero) || valorNumero <= 0) {
      setErroLocal("Informe um valor maior que zero.");
      return;
    }
    if (Math.round(valorNumero * 100) > Math.round(saldo * 100)) {
      setErroLocal(`O valor não pode passar do saldo (${formatCurrency(saldo)}).`);
      return;
    }
    if (!data) {
      setErroLocal("Informe a data do pagamento.");
      return;
    }

    setErroLocal(null);
    onSave({ valor: valorNumero, forma_pagamento: forma, data });
  }

  const mensagemErro = erroLocal ?? erro;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-16 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3.5 border-b border-gray-100 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#1B2130]">
              Registrar pagamento
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              OS #{ordemId} · saldo em aberto de {formatCurrency(saldo)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          >
            <X size={15} />
          </button>
        </div>

        <form
          id="payment-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1B2130]">
                Valor (R$)
              </label>
              <div className="relative">
                <DollarSign
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="text"
                  inputMode="decimal"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="0,00"
                  required
                  className="payment-input"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1B2130]">
                Data
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={data}
                  max={hoje()}
                  onChange={(e) => setData(e.target.value)}
                  required
                  className="payment-input"
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Forma de pagamento
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FORMAS_PAGAMENTO.map((opcao) => (
                <button
                  key={opcao.value}
                  type="button"
                  onClick={() => setForma(opcao.value)}
                  className={`rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                    forma === opcao.value
                      ? "border-[#FF7518] bg-orange-50 text-[#FF7518]"
                      : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {opcao.label}
                </button>
              ))}
            </div>
          </div>

          {mensagemErro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {mensagemErro}
            </p>
          )}
        </form>

        <div className="flex items-center justify-end gap-2.5 border-t border-gray-100 bg-gray-50/60 p-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-[#1B2130] hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="payment-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF7518]/30 hover:bg-[#e6690f] disabled:opacity-60"
          >
            <Check size={15} />
            {submitting ? "Salvando..." : "Registrar pagamento"}
          </button>
        </div>
      </div>

      <style>{`
        .payment-input {
          width: 100%;
          font-size: 13.5px;
          color: #1B2130;
          border: 1.5px solid #E7E9EE;
          border-radius: 7px;
          padding: 10px 12px 10px 34px;
          background: #FBFBFC;
          outline: none;
          transition: 0.13s;
        }
        .payment-input:focus {
          border-color: #FF7518;
          background: #fff;
          box-shadow: 0 0 0 3px #FDE7DA;
        }
      `}</style>
    </div>
  );
}
