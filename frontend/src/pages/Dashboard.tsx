import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Users,
  Wrench,
  AlertTriangle,
  Package,
  Loader2,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";
import { listClients } from "../services/clients";
import { listStock, type StockItem } from "../services/stock";
import {
  listServiceOrders,
  type ServiceOrder,
} from "../services/serviceOrders";
import { getUserRole } from "../lib/auth";

function formatCurrency(value: string | number) {
  return Number(value)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

export default function Dashboard() {
  const navigate = useNavigate();

  const [totalClientes, setTotalClientes] = useState(0);
  const [ordens, setOrdens] = useState<ServiceOrder[]>([]);
  const [itensBaixoEstoque, setItensBaixoEstoque] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    const perfil = getUserRole();
    try {
      const [clientes, stock, ordensData] = await Promise.all([
        listClients(),
        perfil === "PROPRIETARIO" ? listStock() : Promise.resolve([]),
        listServiceOrders(),
      ]);
      setTotalClientes(clientes.length);
      setItensBaixoEstoque(stock.filter((item) => item.alerta_minimo));
      setOrdens(ordensData);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados da oficina.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const ordensAbertas = ordens.filter(
    (o) => o.status === "ABERTA" || o.status === "EM_ANDAMENTO",
  );
  const veiculosEmOficina = new Set(ordensAbertas.map((o) => o.veiculo_id))
    .size;
  const ordensRecentes = ordens.slice(0, 5);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Carregando visão geral...
      </div>
    );
  }

  if (error) {
    return <div className="p-10 text-center text-sm text-red-500">{error}</div>;
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Início</h1>
        <p className="text-sm text-gray-500">Visão geral da oficina</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard
          label="Ordens abertas"
          value={ordensAbertas.length}
          icon={ClipboardList}
          accentColor="#FF7518"
        />
        <StatCard
          label="Clientes ativos"
          value={totalClientes}
          icon={Users}
          accentColor="#A855F7"
        />
        <StatCard
          label="Veículos em oficina"
          value={veiculosEmOficina}
          icon={Wrench}
          accentColor="#2563EB"
        />
      </div>

      {itensBaixoEstoque.length > 0 && (
        <div className="flex flex-col gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
              <AlertTriangle size={18} />
            </div>
            <div>
              <p className="font-semibold text-amber-900">
                {itensBaixoEstoque.length}{" "}
                {itensBaixoEstoque.length === 1
                  ? "item com estoque abaixo do mínimo"
                  : "itens com estoque abaixo do mínimo"}
              </p>
              <p className="text-sm text-amber-700">
                {itensBaixoEstoque
                  .slice(0, 3)
                  .map((item) => item.nome)
                  .join(", ")}
                {itensBaixoEstoque.length > 3 &&
                  ` e mais ${itensBaixoEstoque.length - 3}`}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate("/estoque")}
            className="flex shrink-0 items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
          >
            <Package size={15} />
            Ver estoque
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 p-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
            <ClipboardList size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Ordens recentes</p>
            <p className="text-xs text-gray-500">
              Mostrando as {ordensRecentes.length} ordens mais recentes
            </p>
          </div>
        </div>

        {ordensRecentes.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Nenhuma ordem de serviço cadastrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Ordem</th>
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {ordensRecentes.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/ordens-servico/${order.id}`)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#FF7518]">
                      #OS-{order.id}
                    </td>
                    <td className="px-5 py-4 text-[#1F1F1F]">
                      {order.cliente?.nome}
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                      {formatCurrency(order.valor_total)}
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
