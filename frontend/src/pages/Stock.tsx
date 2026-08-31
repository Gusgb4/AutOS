import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Package,
  AlertTriangle,
  Tags,
  DollarSign,
  Search,
  Plus,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import { listStock, deleteStockItem, type StockItem } from "../services/stock";

export default function Stock() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [excluindo, setExcluindo] = useState<number | null>(null);

  useEffect(() => {
    async function carregar() {
      try {
        setLoading(true);
        setErro(null);
        const data = await listStock();
        setItems(data);
      } catch (e: any) {
        setErro(
          e.response?.data?.error ?? "Não foi possível carregar o estoque.",
        );
      } finally {
        setLoading(false);
      }
    }

    carregar();
  }, []);

  const totalItens = items.length;
  const estoqueBaixo = items.filter((item) => item.alerta_minimo).length;
  const valorTotal = items.reduce(
    (soma, item) => soma + item.quantidade * Number(item.valor_unitario),
    0,
  );
  const totalCategorias = new Set(
    items.map((item) => item.categoria).filter(Boolean),
  ).size;

  const termo = busca.trim().toLowerCase();
  const itensFiltrados = termo
    ? items.filter((item) =>
        [item.nome, item.categoria, item.fornecedor].some((campo) =>
          (campo ?? "").toLowerCase().includes(termo),
        ),
      )
    : items;

  async function handleExcluir(item: StockItem) {
    const confirmado = window.confirm(
      `Excluir "${item.nome}"? Essa ação não pode ser desfeita.`,
    );
    if (!confirmado) return;

    try {
      setExcluindo(item.id);
      setErro(null);
      await deleteStockItem(item.id);
      setItems((atuais) => atuais.filter((i) => i.id !== item.id));
    } catch (e: any) {
      setErro(e.response?.data?.error ?? "Não foi possível excluir o item.");
    } finally {
      setExcluindo(null);
    }
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Estoque</h1>
        <p className="text-sm text-gray-500">
          Gerencie o estoque de peças, suprimentos e materiais.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="TOTAL DE ITENS"
          value={totalItens}
          icon={Package}
          accentColor="#FF7518"
        />
        <StatCard
          label="ESTOQUE BAIXO"
          value={estoqueBaixo}
          icon={AlertTriangle}
          accentColor="#F59E0B"
          valueColor
        />
        <StatCard
          label="CATEGORIAS"
          value={totalCategorias}
          icon={Tags}
          accentColor="#A855F7"
        />
        <StatCard
          label="VALOR TOTAL"
          value={valorTotal.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
          })}
          icon={DollarSign}
          accentColor="#10B981"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
              <Package size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">Lista de itens</p>
              <p className="text-xs text-gray-500">
                Todos os itens de estoque registrados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por nome, categoria ou fornecedor..."
                className="w-64 rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF7518]"
              />
            </div>
            <Link
              to="/estoque/novo"
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
            >
              <Plus size={16} />
              Adicionar Item
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando itens...
          </div>
        ) : erro ? (
          <div className="p-10 text-center text-sm text-red-500">{erro}</div>
        ) : itensFiltrados.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {termo
              ? `Nenhum item encontrado para "${busca}".`
              : "Nenhum item cadastrado ainda."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Nome do item</th>
                  <th className="px-5 py-3 font-medium">Categoria</th>
                  <th className="px-5 py-3 font-medium">Quantidade</th>
                  <th className="px-5 py-3 font-medium">Mínimo</th>
                  <th className="px-5 py-3 font-medium">Preço unitário</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {itensFiltrados.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                      {item.nome}
                    </td>

                    <td className="px-5 py-4">
                      {item.categoria ? (
                        <span className="w-max rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                          {item.categoria}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-gray-700">
                      <span
                        className={
                          item.alerta_minimo ? "font-medium text-amber-600" : ""
                        }
                      >
                        {item.quantidade}
                      </span>{" "}
                      <span className="text-gray-400">un.</span>
                    </td>

                    <td className="px-5 py-4 text-gray-600">
                      {item.quantidade_minima}
                    </td>

                    <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                      {Number(item.valor_unitario).toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex w-max items-center rounded-full px-3 py-1 text-xs font-medium ${
                          item.alerta_minimo
                            ? "bg-amber-100 text-amber-700"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {item.alerta_minimo ? "Estoque baixo" : "Em estoque"}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/estoque/${item.id}/editar`}
                          aria-label="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleExcluir(item)}
                          disabled={excluindo === item.id}
                          aria-label="Excluir"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                        >
                          {excluindo === item.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Trash2 size={14} />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-400">
          Mostrando {itensFiltrados.length} de {totalItens} itens
        </div>
      </div>
    </div>
  );
}
