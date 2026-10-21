import { useState } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";

const plainInputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3 py-2.5 text-base text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA] md:text-sm";

function formatCurrency(value: string | number) {
  return Number(value)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

export interface PecaItem {
  id: number;
  quantidade: number;
  valor_unitario: string | number;
  item_estoque: {
    id: number;
    nome: string;
  };
}

interface PecaRowProps {
  peca: PecaItem;
  saving: boolean;
  onSaveQuantidade: (novaQuantidade: number) => void;
  onRemove: () => void;
  /**
   * true  -> edição exige confirmação explícita (faixa amarela com
   *          "Cancelar" / "Confirmar alteração"). Usado em ServiceOrderDetails.
   * false -> edição salva ao clicar no ícone de check (padrão).
   *          Usado em NewServiceOrder.
   */
  confirmBeforeSave?: boolean;
}

export default function PecaRow({
  peca,
  saving,
  onSaveQuantidade,
  onRemove,
  confirmBeforeSave = false,
}: PecaRowProps) {
  const [quantidadeTexto, setQuantidadeTexto] = useState(
    String(peca.quantidade),
  );

  // Salvou (ou veio outra peça): o campo volta pro valor que está na OS
  const [anterior, setAnterior] = useState({
    id: peca.id,
    quantidade: peca.quantidade,
  });
  if (peca.id !== anterior.id || peca.quantidade !== anterior.quantidade) {
    setAnterior({ id: peca.id, quantidade: peca.quantidade });
    setQuantidadeTexto(String(peca.quantidade));
  }

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

        {!confirmBeforeSave && (
          <div className="flex h-[42px] w-[42px] shrink-0 items-center justify-center">
            {dirty && !saving && (
              <button
                type="button"
                onClick={handleSave}
                aria-label="Salvar alteração"
                className="flex h-full w-full items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
              >
                <Check size={16} />
              </button>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={onRemove}
          disabled={saving}
          className="ml-auto flex shrink-0 items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
        >
          {saving ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <Trash2 size={15} />
          )}
          Remover
        </button>
      </div>

      {confirmBeforeSave && dirty && (
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
              className="rounded-lg border border-gray-200 bg-white px-3 py-3 text-xs font-semibold text-gray-600 hover:bg-gray-50 md:py-1.5"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 md:py-1.5"
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