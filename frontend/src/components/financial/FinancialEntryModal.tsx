import { useEffect, useState, type FormEvent } from "react";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  Check,
  DollarSign,
  FileText,
  X,
} from "lucide-react";
import type { FinancialEntryPayload, TipoLancamento } from "../../services/financial";

interface FinancialEntryModalProps {
  open: boolean;
  submitting?: boolean;
  erro?: string | null;
  onClose: () => void;
  onSave: (payload: FinancialEntryPayload) => void;
}

const emptyForm = {
  tipo: "RECEITA" as TipoLancamento,
  descricao: "",
  valor: "",
  data: "",
};

export default function FinancialEntryModal({
  open,
  submitting = false,
  erro,
  onClose,
  onSave,
}: FinancialEntryModalProps) {
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    if (open) setForm(emptyForm);
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const valor = Number(form.valor.replace(",", "."));
    if (!Number.isFinite(valor) || valor <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    onSave({
      tipo: form.tipo,
      descricao: form.descricao.trim(),
      valor,
      data: form.data || undefined,
    });
  }

  const isReceita = form.tipo === "RECEITA";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 px-4 py-16 backdrop-blur-sm">
      <div className="flex w-full max-w-lg flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start gap-3.5 border-b border-gray-100 p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <DollarSign size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-[#1B2130]">
              Novo Lançamento
            </h2>
            <p className="mt-0.5 text-sm text-gray-500">
              Registre manualmente uma receita ou uma despesa da oficina.
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
          id="financial-entry-form"
          onSubmit={handleSubmit}
          className="flex flex-col gap-4 p-5"
        >
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">Tipo</label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo: "RECEITA" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  isReceita
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <ArrowUpCircle size={16} />
                Receita
              </button>
              <button
                type="button"
                onClick={() => setForm((p) => ({ ...p, tipo: "DESPESA" }))}
                className={`flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-semibold transition ${
                  !isReceita
                    ? "border-red-500 bg-red-50 text-red-600"
                    : "border-gray-200 bg-white text-gray-500 hover:bg-gray-50"
                }`}
              >
                <ArrowDownCircle size={16} />
                Despesa
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Descrição
            </label>
            <div className="relative">
              <FileText
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={form.descricao}
                onChange={(e) =>
                  setForm((p) => ({ ...p, descricao: e.target.value }))
                }
                placeholder="Ex: Compra de óleo lubrificante"
                minLength={3}
                required
                className="entry-input"
              />
            </div>
          </div>

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
                  type="number"
                  value={form.valor}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, valor: e.target.value }))
                  }
                  placeholder="0,00"
                  step="0.01"
                  min="0.01"
                  required
                  className="entry-input"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-[#1B2130]">
                Data{" "}
                <span className="font-medium text-gray-400">(opcional)</span>
              </label>
              <div className="relative">
                <Calendar
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />
                <input
                  type="date"
                  value={form.data}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, data: e.target.value }))
                  }
                  className="entry-input"
                />
              </div>
            </div>
          </div>

          {erro && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600">
              {erro}
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
            form="financial-entry-form"
            disabled={submitting}
            className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-[#FF7518]/30 hover:bg-[#e6690f] disabled:opacity-60"
          >
            <Check size={15} />
            {submitting ? "Salvando..." : "Salvar Lançamento"}
          </button>
        </div>
      </div>

      <style>{`
        .entry-input {
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
        .entry-input:focus {
          border-color: #FF7518;
          background: #fff;
          box-shadow: 0 0 0 3px #FDE7DA;
        }
      `}</style>
    </div>
  );
}
