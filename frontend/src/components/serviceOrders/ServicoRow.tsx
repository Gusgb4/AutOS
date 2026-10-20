import { useState, useEffect } from "react";
import { Check, Loader2, Trash2 } from "lucide-react";

const plainInputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3 py-2.5 text-base text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA] md:text-sm";

export interface ServicoItem {
  id: number;
  descricao: string;
  valor: string | number;
}

interface ServicoRowProps {
  servico: ServicoItem;
  saving: boolean;
  onSave: (descricao: string, valor: number) => void;
  onRemove: () => void;
  /**
   * true  -> edição exige confirmação explícita (faixa amarela com
   *          "Cancelar" / "Confirmar alteração"). Usado em ServiceOrderDetails.
   * false -> edição salva ao clicar no ícone de check (padrão).
   *          Usado em NewServiceOrder.
   */
  confirmBeforeSave?: boolean;
}

export default function ServicoRow({
  servico,
  saving,
  onSave,
  onRemove,
  confirmBeforeSave = false,
}: ServicoRowProps) {
  const [descricao, setDescricao] = useState(servico.descricao);
  const [valorTexto, setValorTexto] = useState(String(servico.valor));

  useEffect(() => {
    setDescricao(servico.descricao);
    setValorTexto(String(servico.valor));
  }, [servico.id, servico.descricao, servico.valor]);

  const dirty =
    descricao.trim() !== servico.descricao ||
    Number(valorTexto.replace(",", ".")) !== Number(servico.valor);

  function handleSave() {
    const valorNumero = Number(valorTexto.replace(",", "."));
    if (!descricao.trim() || !valorNumero || valorNumero <= 0) {
      alert("Descrição e valor válidos são obrigatórios.");
      return;
    }
    onSave(descricao.trim(), valorNumero);
  }

  function handleCancelar() {
    setDescricao(servico.descricao);
    setValorTexto(String(servico.valor));
  }

  return (
    <li className="flex flex-col bg-gray-50/50">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex flex-1 flex-col gap-1.5 sm:flex-[2]">
          <label className="text-xs font-semibold text-[#1B2130]">
            Descrição do serviço
          </label>
          <input
            type="text"
            value={descricao}
            disabled={saving}
            onChange={(e) => setDescricao(e.target.value)}
            className={plainInputClass}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-[#1B2130]">
            Valor (R$)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={valorTexto}
            disabled={saving}
            onChange={(e) => setValorTexto(e.target.value)}
            className={`${plainInputClass} text-right sm:w-32`}
          />
        </div>

        {/* Modo inline: ícone de check aparece junto à linha, sem banner */}
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

      {/* Modo confirmação: faixa amarela com Cancelar / Confirmar alteração */}
      {confirmBeforeSave && dirty && (
        <div className="flex flex-col items-center justify-between gap-3 border-t border-amber-200 bg-amber-50 px-5 py-3 sm:flex-row">
          <p className="text-xs text-amber-800">
            Serviço alterado. Confirme para aplicar.
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