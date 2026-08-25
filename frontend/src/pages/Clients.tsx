import { useState } from "react";
import {
  Users,
  UserPlus,
  ClipboardList,
  Car,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Download,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";

interface Client {
  id: string;
  nome: string;
  clienteDesde: string;
  telefone: string;
  email: string;
  veiculos: number;
  ultimaVisita: string;
  visitaRelativa: string;
  destaqueVisita?: boolean; // "Hoje"
}

const mockClients: Client[] = [
  {
    id: "1",
    nome: "James Whitaker",
    clienteDesde: "Client since Jan 2021",
    telefone: "(47) 99234-5678",
    email: "james.whitaker@email.com",
    veiculos: 2,
    ultimaVisita: "Jul 14, 2025",
    visitaRelativa: "Hoje",
    destaqueVisita: true,
  },
  {
    id: "2",
    nome: "Sarah Mitchell",
    clienteDesde: "Client since Mar 2022",
    telefone: "(47) 99891-2345",
    email: "s.mitchell@gmail.com",
    veiculos: 1,
    ultimaVisita: "Jul 10, 2025",
    visitaRelativa: "4 dias atrás",
  },
  {
    id: "3",
    nome: "Robert Alvarez",
    clienteDesde: "Client since Jun 2021",
    telefone: "(47) 99456-7890",
    email: "r.alvarez@outlook.com",
    veiculos: 3,
    ultimaVisita: "Jul 8, 2025",
    visitaRelativa: "6 dias atrás",
  },
  {
    id: "4",
    nome: "Emily Carter",
    clienteDesde: "Client since Sep 2022",
    telefone: "(47) 99112-3344",
    email: "emily.carter@yahoo.com",
    veiculos: 1,
    ultimaVisita: "Jun 29, 2025",
    visitaRelativa: "15 dias atrás",
  },
  {
    id: "5",
    nome: "Daniel Thompson",
    clienteDesde: "Client since Feb 2024",
    telefone: "(47) 99667-8899",
    email: "d.thompson@icloud.com",
    veiculos: 2,
    ultimaVisita: "Jun 22, 2025",
    visitaRelativa: "22 dias atrás",
  },
  {
    id: "6",
    nome: "Olivia Bennett",
    clienteDesde: "Client since Nov 2020",
    telefone: "(47) 99321-6547",
    email: "olivia.b@hotmail.com",
    veiculos: 4,
    ultimaVisita: "Jul 15, 2025",
    visitaRelativa: "29 dias atrás",
  },
  {
    id: "7",
    nome: "Marcus Johnson",
    clienteDesde: "Client since Aug 2023",
    telefone: "(47) 99543-2109",
    email: "m.johnson@email.com",
    veiculos: 1,
    ultimaVisita: "Jun 5, 2025",
    visitaRelativa: "30 dias atrás",
  },
  {
    id: "8",
    nome: "Priya Nair",
    clienteDesde: "Cliente desde Mai 2021",
    telefone: "(47) 99709-4421",
    email: "priya.nair@email.com",
    veiculos: 2,
    ultimaVisita: "Mai 30, 2025",
    visitaRelativa: "45 dias atrás",
  },
  {
    id: "9",
    nome: "Tom Henderson",
    clienteDesde: "Cliente desde Dez 2022",
    telefone: "(47) 99830-1156",
    email: "tomhend@gmail.com",
    veiculos: 1,
    ultimaVisita: "Mai 18, 2025",
    visitaRelativa: "57 dias atrás",
  },
  {
    id: "10",
    nome: "Nina Ferraro",
    clienteDesde: "Cliente desde Jul 2020",
    telefone: "(47) 99274-9930",
    email: "nina.ferraro@work.com",
    veiculos: 3,
    ultimaVisita: "Abr 30, 2025",
    visitaRelativa: "75 dias atrás",
  },
];

const TOTAL_CLIENTS = 248;
const PAGE_SIZE = 10;
const TOTAL_PAGES = Math.ceil(TOTAL_CLIENTS / PAGE_SIZE);

export default function Clients() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Clientes</h1>
        <p className="text-sm text-gray-500">
          Gerencie e visualize todos os clientes cadastrados.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="TODOS CLIENTES"
          value={248}
          icon={Users}
          accentColor="#FF7518"
        />
        <StatCard
          label="NOVOS NESTE MÊS"
          value={14}
          icon={UserPlus}
          accentColor="#10B981"
        />
        <StatCard
          label="ORDENS ATIVAS"
          value={37}
          icon={ClipboardList}
          accentColor="#2563EB"
        />
        <StatCard
          label="TODOS VEÍCULOS"
          value={312}
          icon={Car}
          accentColor="#A855F7"
        />
      </div>

      {/* Search + actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative flex-1 max-w-md">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, telefone, ou placa..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF7518]"
            />
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <SlidersHorizontal size={15} />
            Filtro
          </button>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
          >
            <ArrowUpDown size={15} />
            Organizar
          </button>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
        >
          <Plus size={16} />
          Add Client
        </button>
      </div>

      {/* Table card */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        {/* Table header */}
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
              <Users size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">Clientes Totais</p>
              <p className="text-xs text-gray-500">
                Mostrando 10 de {TOTAL_CLIENTS} clientes
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              {TOTAL_CLIENTS} total
            </span>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={13} />
              Export
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Veículos</th>
                <th className="px-5 py-3 font-medium">Última visita</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockClients.map((client) => (
                <tr
                  key={client.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-5 py-4">
                    <p className="font-medium text-[#1F1F1F]">{client.nome}</p>
                    <p className="text-xs text-gray-400">
                      {client.clienteDesde}
                    </p>
                  </td>
                  <td className="px-5 py-4 text-gray-600">
                    {client.telefone}
                  </td>
                  <td className="px-5 py-4 text-gray-600">{client.email}</td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center gap-1.5 text-gray-600">
                      <Car size={14} className="text-[#FF7518]" />
                      {client.veiculos}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700">{client.ultimaVisita}</p>
                    <p
                      className={`text-xs ${
                        client.destaqueVisita
                          ? "font-medium text-emerald-600"
                          : "text-gray-400"
                      }`}
                    >
                      {client.visitaRelativa}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        aria-label="Visualizar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Editar"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        aria-label="Excluir"
                        className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <p className="text-xs text-gray-500">
            Mostrando {(page - 1) * PAGE_SIZE + 1}-
            {Math.min(page * PAGE_SIZE, TOTAL_CLIENTS)} de {TOTAL_CLIENTS}{" "}
            clientes
          </p>

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
        </div>
      </div>
    </div>
  );
}