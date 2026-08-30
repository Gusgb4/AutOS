import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  Users,
  Car,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import DisabledBadge from "../components/ui/DisabledBadge";
import { createVehicle } from "../services/vehicles";
import ClientFormModal, {
  type ClientFormData,
  type NewVehicleData,
} from "../components/clients/ClientFormModal";
import {
  listClients,
  createClient,
  updateClient,
  deleteClient,
  type Client,
} from "../services/clients";

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = useCallback(async (termo?: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await listClients(termo);
      setClients(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Carga inicial
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Busca com debounce
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchClients(search || undefined);
    }, 400);
    return () => clearTimeout(timeout);
  }, [search, fetchClients]);

  function openAddModal() {
    setModalMode("add");
    setEditingClient(null);
    setModalOpen(true);
  }

  function openEditModal(client: Client) {
    setModalMode("edit");
    setEditingClient(client);
    setModalOpen(true);
  }

  async function handleSave(data: ClientFormData, vehicle?: NewVehicleData) {
    setSubmitting(true);
    try {
      if (modalMode === "edit" && editingClient) {
        await updateClient(editingClient.id, data);
      } else {
        const newClient = await createClient(data);

        if (vehicle) {
          try {
            await createVehicle({
              cliente_id: newClient.id,
              marca: vehicle.marca,
              modelo: vehicle.modelo,
              placa: vehicle.placa,
              ano: vehicle.ano,
            });
          } catch (vehicleErr: any) {
            // Cliente já foi criado; avisa mas não desfaz o cadastro
            alert(
              "Cliente criado, mas houve um erro ao cadastrar o veículo: " +
                (vehicleErr?.response?.data?.erro ||
                  vehicleErr?.response?.data?.errors?.[0]?.message ||
                  "erro desconhecido."),
            );
          }
        }
      }
      setModalOpen(false);
      await fetchClients(search || undefined);
    } catch (err: any) {
      alert(
        err?.response?.data?.erro ||
          err?.response?.data?.errors?.[0]?.message ||
          "Erro ao salvar cliente.",
      );
    } finally {
      setSubmitting(false);
    }
  } 

  async function handleDelete() {
    if (!editingClient) return;
    if (!confirm(`Remover o cliente "${editingClient.nome}"?`)) return;

    setSubmitting(true);
    try {
      await deleteClient(editingClient.id);
      setModalOpen(false);
      await fetchClients(search || undefined);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover cliente.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDeleteDirect(client: Client) {
    if (!confirm(`Remover o cliente "${client.nome}"?`)) return;
    try {
      await deleteClient(client.id);
      await fetchClients(search || undefined);
    } catch (err) {
      console.error(err);
      alert("Erro ao remover cliente.");
    }
  }

  const totalVeiculos = clients.reduce(
    (acc, c) => acc + c.veiculos.length,
    0,
  );

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Clientes</h1>
        <p className="text-sm text-gray-500">
          Gerencie e visualize todos os clientes cadastrados.
        </p>
      </div>

      {/* Stat cards (reais, derivados da lista carregada) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="TODOS CLIENTES"
          value={clients.length}
          icon={Users}
          accentColor="#FF7518"
        />
        <StatCard
          label="TODOS VEÍCULOS"
          value={totalVeiculos}
          icon={Car}
          accentColor="#A855F7"
        />
        <StatCard label="NOVOS NESTE MÊS" value="—" icon={Users} accentColor="#10B981" />
        <StatCard label="ORDENS ATIVAS" value="—" icon={Users} accentColor="#2563EB" />
      </div>

      {/* Search + actions bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-3">
          <div className="relative max-w-md flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome..."
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
          onClick={openAddModal}
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
                Mostrando {clients.length} clientes
              </p>
            </div>
          </div>
        </div>

        {/* Estados de carregamento / erro / vazio */}
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando clientes...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-red-500">{error}</div>
        ) : clients.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Nenhum cliente encontrado.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium">Documento</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Veículos</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                      {client.nome}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {client.telefone}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {client.documento}
                    </td>
                    <td className="px-5 py-4">
                      <DisabledBadge />
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 text-gray-600">
                        <Car size={14} className="text-[#FF7518]" />
                        {client.veiculos.length}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/clientes/${client.id}`}
                          aria-label="Visualizar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100"
                        >
                          <Eye size={14} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => openEditModal(client)}
                          aria-label="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteDirect(client)}
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
        )}
      </div>

      <ClientFormModal
        mode={modalMode}
        open={modalOpen}
        clientName={editingClient?.nome}
        initialData={
          editingClient
            ? {
                nome: editingClient.nome,
                telefone: editingClient.telefone,
                documento: editingClient.documento,
              }
            : undefined
        }
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={modalMode === "edit" ? handleDelete : undefined}
      />
    </div>
  );
}