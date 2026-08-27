import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  ChevronDown,
  Calendar,
  Plus,
  Eye,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";

interface Order {
  id: string;
  cliente: string;
  email: string;
  veiculo: string;
  servico: string;
  status: "em_andamento" | "fechada" | "cancelado";
  data: string;
  valorTotal: string;
}

const mockOrders: Order[] = [
  {
    id: "#OS-1048",
    cliente: "James Whitaker",
    email: "james@email.com",
    veiculo: "BMW X5 2022",
    servico: "Serviço no Motor",
    status: "em_andamento",
    data: "Jul 14, 2025",
    valorTotal: "R$1.240,00",
  },
  {
    id: "#OS-1047",
    cliente: "Sarah Mitchell",
    email: "sarah@email.com",
    veiculo: "Audi A4 2020",
    servico: "Troca dos Freios",
    status: "fechada",
    data: "Jul 13, 2025",
    valorTotal: "R$68,00",
  },
  {
    id: "#OS-1046",
    cliente: "Marcus Reyes",
    email: "marcus@email.com",
    veiculo: "Toyota Corolla 2019",
    servico: "Troca de Óleo + Filtro",
    status: "fechada",
    data: "Jul 13, 2025",
    valorTotal: "R$20,00",
  },
  {
    id: "#OS-1045",
    cliente: "Diana Flores",
    email: "diana@email.com",
    veiculo: "Honda Civic 2021",
    servico: "Revisão Suspensão",
    status: "fechada",
    data: "Jul 12, 2025",
    valorTotal: "R$490,00",
  },
  {
    id: "#OS-1044",
    cliente: "Robert Chen",
    email: "robert@email.com",
    veiculo: "Ford F-150 2023",
    servico: "Reparo na Transmissão",
    status: "em_andamento",
    data: "Jul 12, 2025",
    valorTotal: "R$2.350,00",
  },
  {
    id: "#OS-1043",
    cliente: "Amanda Torres",
    email: "amanda@email.com",
    veiculo: "VW Golf 2018",
    servico: "Reparo AC",
    status: "cancelado",
    data: "Jul 11, 2025",
    valorTotal: "R$0,00",
  },
  {
    id: "#OS-1042",
    cliente: "Kevin Patel",
    email: "kevin@email.com",
    veiculo: "Mercedes C300 2021",
    servico: "Revisão Completa",
    status: "fechada",
    data: "Jul 10, 2025",
    valorTotal: "R$850,00",
  },
  {
    id: "#OS-1041",
    cliente: "Lisa Nakamura",
    email: "lisa@email.com",
    veiculo: "Subaru WRX 2020",
    servico: "Balanceamento",
    status: "fechada",
    data: "Jul 10, 2025",
    valorTotal: "R$120,00",
  },
  {
    id: "#OS-1040",
    cliente: "Ethan Brooks",
    email: "ethan@email.com",
    veiculo: "Chevrolet Onix 2022",
    servico: "Sistema de Escape",
    status: "em_andamento",
    data: "Jul 09, 2025",
    valorTotal: "R$975,00",
  },
  {
    id: "#OS-1039",
    cliente: "Noah Simmons",
    email: "noah@email.com",
    veiculo: "Hyundai Tucson 2021",
    servico: "Radiador",
    status: "fechada",
    data: "Jul 08, 2025",
    valorTotal: "R$310,00",
  },
];

const TOTAL_ORDERS = 64;
const TOTAL_PAGES = 7;

export default function ServiceOrders() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">
            Ordens de Serviço
          </h1>
          <p className="text-sm text-gray-500">
            Gerencie as ordens de serviço da sua oficina
          </p>
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
        >
          <Plus size={16} />
          Nova Ordem
        </button>
      </div>

      {/* Search + filters bar */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white p-3 shadow-sm sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por cliente, veículo, placa ou número"
            className="w-full rounded-xl border border-gray-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF7518]"
          />
        </div>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          Status
          <ChevronDown size={15} />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          <Calendar size={15} />
          Jul 2025
          <ChevronDown size={15} />
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Ordem</th>
                <th className="px-5 py-3 font-medium">
                  <span className="flex items-center gap-1">
                    Cliente
                    <ChevronDown size={12} />
                  </span>
                </th>
                <th className="px-5 py-3 font-medium">Veículo</th>
                <th className="px-5 py-3 font-medium">
                  <span className="flex items-center gap-1">
                    Status
                    <ChevronDown size={12} />
                  </span>
                </th>
                <th className="px-5 py-3 font-medium">
                  <span className="flex items-center gap-1">
                    Data
                    <ChevronDown size={12} />
                  </span>
                </th>
                <th className="px-5 py-3 font-medium">
                  <span className="flex items-center gap-1">
                    Valor Total
                    <ChevronDown size={12} />
                  </span>
                </th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-5 py-4 font-medium text-[#FF7518]">
                    {order.id}
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#1F1F1F]">
                      {order.cliente}
                    </p>
                    <p className="text-xs text-gray-400">{order.email}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700">{order.veiculo}</p>
                    <p className="text-xs text-gray-400">{order.servico}</p>
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-5 py-4 text-gray-600">{order.data}</td>
                  <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                    {order.valorTotal}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/ordens-servico/${order.id.replace("#", "")}`}
                        aria-label="Visualizar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Eye size={15} />
                      </Link>
                      <button
                        type="button"
                        aria-label="Mais opções"
                        className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex flex-col items-center justify-between gap-3 border-t border-gray-100 p-4 sm:flex-row">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Showing</span>
            <div className="relative">
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="appearance-none rounded-lg border border-gray-200 bg-white py-1 pl-2 pr-6 text-xs text-gray-600 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400"
              />
            </div>
            <span>of {TOTAL_ORDERS} orders</span>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft size={16} />
            </button>

            {[1, 2, 3].map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                  page === p
                    ? "bg-[#FF7518] font-medium text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}

            <span className="px-1 text-gray-400">...</span>

            <button
              type="button"
              onClick={() => setPage(TOTAL_PAGES)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                page === TOTAL_PAGES
                  ? "bg-[#FF7518] font-medium text-white"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              {TOTAL_PAGES}
            </button>

            <button
              type="button"
              disabled={page === TOTAL_PAGES}
              onClick={() => setPage((p) => Math.min(TOTAL_PAGES, p + 1))}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span>Go to page</span>
            <input
              type="number"
              min={1}
              max={TOTAL_PAGES}
              defaultValue={1}
              className="w-14 rounded-lg border border-gray-200 py-1 text-center text-xs outline-none focus:border-[#FF7518]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}