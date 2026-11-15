import { useState } from "react";
import { Loader2, PackagePlus, X } from "lucide-react";
import { addPecaRapida, type ServiceOrder } from "../../services/serviceOrders";
import { mensagemDeErro } from "../../lib/errors";

const inputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-white px-3 py-2.5 text-base text-[#1B2130] outline-none focus:border-[#FF7518] focus:ring-2 focus:ring-[#FDE7DA] md:text-sm";

// "150,50" ou "150.50" vira 150.5; vazio vira undefined
function numero(texto: string) {
  const limpo = texto.trim().replace(/\./g, "").replace(",", ".");
  if (!limpo) return undefined;
  const valor = Number(limpo);
  return Number.isFinite(valor) ? valor : NaN;
}

interface PecaRapidaProps {
  ordemId: number;
  onAdicionada: (ordem: ServiceOrder) => void;
}

// Peça comprada na hora para esta OS: cadastra no estoque e já usa na OS,
// sem sair da tela. Só aparece para o proprietário (é ele quem cadastra peças).
export default function PecaRapida({ ordemId, onAdicionada }: PecaRapidaProps) {
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [custo, setCusto] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function fechar() {
    setAberto(false);
    setNome("");
    setPreco("");
    setCusto("");
    setQuantidade("1");
    setErro(null);
  }

  async function salvar() {
    const valorFinal = numero(preco);
    const valorEntrada = numero(custo);
    const qtd = Number(quantidade);

    if (!nome.trim()) return setErro("Informe o nome da peça.");
    if (!valorFinal || Number.isNaN(valorFinal) || valorFinal <= 0) {
      return setErro("Informe um preço de venda maior que zero.");
    }
    if (Number.isNaN(valorEntrada)) return setErro("Custo inválido.");
    if (!Number.isInteger(qtd) || qtd <= 0) {
      return setErro("Informe uma quantidade maior que zero.");
    }

    setSalvando(true);
    setErro(null);
    try {
      const { ordem } = await addPecaRapida(ordemId, {
        nome: nome.trim(),
        valor_final: valorFinal,
        valor_entrada: valorEntrada,
        quantidade: qtd,
      });
      onAdicionada(ordem);
      fechar();
    } catch (err) {
      setErro(mensagemDeErro(err, "Não foi possível adicionar a peça."));
    } finally {
      setSalvando(false);
    }
  }

  if (!aberto) {
    return (
      <div className="bg-gray-50/50 px-5 pb-4">
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="flex items-center gap-1.5 text-sm font-medium text-[#FF7518] hover:underline"
        >
          <PackagePlus size={15} />
          Peça nova (comprada agora)
        </button>
      </div>
    );
  }

  return (
    <div className="border-t border-gray-100 bg-orange-50/40 p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#1F1F1F]">Peça nova</p>
          <p className="text-xs text-gray-500">
            Para a peça que não está no estoque: ela é cadastrada e já entra
            nesta OS. O estoque fica com zero.
          </p>
        </div>
        <button
          type="button"
          onClick={fechar}
          aria-label="Fechar"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 hover:bg-white hover:text-gray-600"
        >
          <X size={15} />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[1fr_8rem_8rem_6rem]">
        <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <span className="text-xs font-semibold text-[#1B2130]">Nome da peça</span>
          <input
            type="text"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Ex.: Sensor de rotação"
            autoFocus
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#1B2130]">Preço de venda (R$)</span>
          <input
            type="text"
            inputMode="decimal"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
        </label>
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold text-[#1B2130]">Custo (opcional)</span>
          <input
            type="text"
            inputMode="decimal"
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            placeholder="0,00"
            className={inputClass}
          />
        </label>
        <label className="col-span-2 flex flex-col gap-1.5 sm:col-span-1">
          <span className="text-xs font-semibold text-[#1B2130]">Quantidade</span>
          <input
            type="number"
            min={1}
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
            className={inputClass}
          />
        </label>
      </div>

      {erro && <p className="mt-3 text-sm text-red-500">{erro}</p>}

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={fechar}
          disabled={salvando}
          className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={salvar}
          disabled={salvando}
          className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
        >
          {salvando && <Loader2 size={15} className="animate-spin" />}
          Cadastrar e adicionar
        </button>
      </div>
    </div>
  );
}
