import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, Eye, Loader2 } from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import { listServiceOrders, type ServiceOrder, type StatusOS } from "../services/serviceOrders";

const STATUS_OPTIONS: { value: StatusOS | ""; label: string }[] = [
  { value: "", label: "Todos os status" },
  { value: "ABERTA", label: "Aberta" },
  { value: "EM_ANDAMENTO", label: "Em andamento" },
  { value: "FINALIZADA", label: "Finalizada" },
  { value: "CANCELADA", label: "Cancelada" },
];

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function ServiceOrders() {
  const navigate = useNavigate();
  const [ordens, setOrdens] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<StatusOS | "">("");

  const fetchOrdens = useCallback(async (status?: StatusOS) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listServiceOrders(status || undefined);
      setOrdens(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar as ordens de serviço.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrdens(statusFiltro || undefined);
  }, [statusFiltro, fetchOrdens]);

  const ordensFiltradas = useMemo(() => {
    const termo = search.trim().toLowerCase();
    if (!termo) return ordens;
    return ordens.filter((o) =>
      [
        String(o.id),
        o.cliente?.nome,
        o.veiculo?.placa,
        o.veiculo?.marca,
        o.veiculo?.modelo,
      ]
        .filter(Boolean)
        .some((campo) => campo!.toLowerCase().includes(termo)),
    );
  }, [ordens, search]);

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Ordens de Serviço</h1>
          <p className="text-sm text-gray-500">Gerencie as ordens de serviço da sua oficina</p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/ordens-servico/novo")}
          className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
        >
          <Plus size={16} />
          Nova Ordem
        </button>
      </div>

      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, veículo, placa ou número"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF7518]"
          />
        </div>

        <select
          value={statusFiltro}
          onChange={(e) => setStatusFiltro(e.target.value as StatusOS | "")}
          className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando ordens de serviço...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-500">{error}</div>
        ) : ordensFiltradas.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {ordens.length === 0 ? "Nenhuma ordem de serviço cadastrada." : "Nenhuma ordem encontrada para essa busca."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Ordem</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Veículo</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Valor Total</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {ordensFiltradas.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/ordens-servico/${order.id}`)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#FF7518]">#OS-{order.id}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#1F1F1F]">{order.cliente?.nome}</p>
                      <p className="text-xs text-gray-400">{order.cliente?.telefone}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700">{order.veiculo?.marca} {order.veiculo?.modelo}</p>
                      <p className="text-xs text-gray-400">{order.veiculo?.placa}</p>
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 text-gray-600">{formatDate(order.created_at)}</td>
                    <td className="px-5 py-4 font-medium text-[#1F1F1F]">{formatCurrency(order.valor_total)}</td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); navigate(`/ordens-servico/${order.id}`); }}
                          aria-label="Visualizar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}