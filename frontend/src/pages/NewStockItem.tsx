import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Package, Check, AlertTriangle } from "lucide-react";
import {
  createStockItem,
  getStockItem,
  updateStockItem,
} from "../services/stock";

const CATEGORIAS = [
  "Freios",
  "Lubrificantes",
  "Filtros",
  "Elétrica",
  "Suspensão",
  "Motor",
  "Outros",
];

const inputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3.5 py-3 text-sm text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA]";

const labelClass =
  "mb-2 block text-xs font-bold uppercase tracking-wide text-gray-500";

export default function NewStockItem() {
  const navigate = useNavigate();
  const { id } = useParams();
  const editando = Boolean(id);

  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [quantidadeMinima, setQuantidadeMinima] = useState("");
  const [valorUnitario, setValorUnitario] = useState("");

  const [salvando, setSalvando] = useState(false);
  const [carregando, setCarregando] = useState(editando);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    async function carregar() {
      try {
        setCarregando(true);
        setErro(null);
        const item = await getStockItem(Number(id));
        setNome(item.nome);
        setCategoria(item.categoria ?? "");
        setFornecedor(item.fornecedor ?? "");
        setQuantidade(String(item.quantidade));
        setQuantidadeMinima(String(item.quantidade_minima));
        setValorUnitario(String(item.valor_unitario));
      } catch (e: any) {
        setErro(e.response?.data?.error ?? "Não foi possível carregar o item.");
      } finally {
        setCarregando(false);
      }
    }

    carregar();
  }, [id]);

  async function handleSubmit() {
    setErro(null);

    if (!nome.trim()) {
      setErro("Informe o nome do item.");
      return;
    }
    if (Number(valorUnitario) <= 0) {
      setErro("O valor unitário deve ser maior que zero.");
      return;
    }

    try {
      setSalvando(true);

      const payload = {
        nome: nome.trim(),
        categoria: categoria || undefined,
        fornecedor: fornecedor.trim() || undefined,
        quantidade: Number(quantidade || 0),
        quantidade_minima: Number(quantidadeMinima || 0),
        valor_unitario: Number(valorUnitario),
      };

      if (id) {
        await updateStockItem(Number(id), payload);
      } else {
        await createStockItem(payload);
      }

      navigate("/estoque");
    } catch (e: any) {
      const data = e.response?.data;
      setErro(
        data?.errors?.[0]?.message ??
          data?.error ??
          "Não foi possível salvar o item.",
      );
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-gray-500">
        Carregando item...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">
            {editando ? "Editar item" : "Adicionar novo item"}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            {editando
              ? "Altere os dados do item de estoque."
              : "Preencha os detalhes para cadastrar um novo item."}
          </p>
        </div>
        <Link
          to="/estoque"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar
        </Link>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-4 border-b border-gray-100 p-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
            <Package size={22} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Informações do item</p>
            <p className="mt-0.5 text-xs text-gray-400">
              Campos com <span className="text-red-500">*</span> são
              obrigatórios
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-x-6 gap-y-6 p-6 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className={labelClass}>
              Nome do item <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Carburador"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Insira um nome de item claro e descritivo.
            </p>
          </div>

          <div>
            <label className={labelClass}>Categoria</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className={inputClass}
            >
              <option value="">Nenhuma categoria</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-gray-400">
              Escolha a categoria mais relevante.
            </p>
          </div>

          <div>
            <label className={labelClass}>Fornecedor</label>
            <input
              type="text"
              value={fornecedor}
              onChange={(e) => setFornecedor(e.target.value)}
              placeholder="Nome do fornecedor"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Nome do fornecedor ou vendedor.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Quantidade atual <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantidade}
              onChange={(e) => setQuantidade(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Quantas unidades estão em estoque agora.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Quantidade mínima <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={quantidadeMinima}
              onChange={(e) => setQuantidadeMinima(e.target.value)}
              placeholder="0"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              O alerta é acionado abaixo desse valor.
            </p>
          </div>

          <div>
            <label className={labelClass}>
              Preço unitário (R$) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              value={valorUnitario}
              onChange={(e) => setValorUnitario(e.target.value)}
              placeholder="0,00"
              className={inputClass}
            />
            <p className="mt-1.5 text-xs text-gray-400">
              Custo por unidade individual.
            </p>
          </div>

          <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 sm:col-span-2">
            <AlertTriangle
              size={18}
              className="mt-0.5 shrink-0 text-amber-500"
            />
            <div>
              <p className="text-sm font-bold text-amber-800">
                Alerta de estoque baixo
              </p>
              <p className="mt-0.5 text-xs text-amber-700">
                Quando a quantidade cair para o mínimo ou abaixo dele, o item é
                sinalizado automaticamente na lista de Estoque.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-gray-100 bg-gray-50/60 p-5">
          {erro && <p className="mr-auto text-sm text-red-500">{erro}</p>}
          <Link
            to="/estoque"
            className="rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-[#1B2130] hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={salvando}
            className="flex items-center gap-2 rounded-lg bg-[#FF7518] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
          >
            <Check size={15} />
            {salvando
              ? "Salvando..."
              : editando
                ? "Salvar alterações"
                : "Salvar item"}
          </button>
        </div>
      </div>
    </div>
  );
}
