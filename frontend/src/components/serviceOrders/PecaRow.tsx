import { useState, useEffect } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";
import type { ServiceOrder } from "../../services/serviceOrders";
import { formatCurrency } from "../../lib/format";
import { plainInputClass } from "../../lib/styles";

type PecaItem = ServiceOrder["pecas"][number];

interface PecaRowProps {
  peca: PecaItem;
  saving: boolean;
  onSaveQuantidade: (novaQuantidade: number) => void;
  onRemove: () => void;
}

export default function PecaRow({
  peca,
  saving,
  onSaveQuantidade,
  onRemove,
}: PecaRowProps) {
  const [quantidadeTexto, setQuantidadeTexto] = useState(
    String(peca.quantidade),
  );

  useEffect(() => {
    setQuantidadeTexto(String(peca.quantidade));
  }, [peca.id, peca.quantidade]);

  const dirty = Number(quantidadeTexto) !== peca.quantidade;

  function handleSave() {
    const novaQuantidade = Number(quantidadeTexto);
    if (!novaQuantidade || novaQuantidade <= 0) {
      alert("Informe uma quantidade válida maior que zero.");
      return;
    }
    onSaveQuantidade(novaQuantidade);
  }

  function handleCancelar() {
    setQuantidadeTexto(String(peca.quantidade));
  }

  return (
    <li className="flex flex-col bg-gray-50/50">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5 sm:flex-[2]">
          <label className="text-xs font-semibold text-[#1B2130]">Peça</label>
          <span className={`${plainInputClass} bg-white`}>
            {peca.item_estoque.nome}
          </span>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1B2130]">
            Quantidade
          </label>
          <input
            type="number"
            min={1}
            value={quantidadeTexto}
            disabled={saving}
            onChange={(e) => setQuantidadeTexto(e.target.value)}
            className={`${plainInputClass} text-right sm:w-24`}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1B2130]">Valor</label>
          <span
            className={`${plainInputClass} bg-white text-right font-medium sm:w-32`}
          >
            {formatCurrency(Number(peca.valor_unitario) * peca.quantidade)}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Remover
        </button>
      </div>

      {dirty && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-5 py-3 sm:flex-row">
          <p className="text-xs text-amber-800">
            Quantidade alterada para <strong>{quantidadeTexto || 0}</strong>.
            Confirme para aplicar.
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCancelar}
              disabled={saving}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              {saving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Check size={13} />
              )}
              Confirmar alteração
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
