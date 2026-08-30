import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  User,
  Pencil,
  Car,
  ClipboardList,
  Plus,
  Trash2,
  History,
  Loader2,
  IdCard,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import DisabledBadge from "../components/ui/DisabledBadge";
import ClientFormModal, {
  type ClientFormData,
} from "../components/clients/ClientFormModal";
import VehicleFormModal, {
  type VehicleFormData,
} from "../components/clients/VehicleFormModal";
import {
  getClientById,
  updateClient,
  type Client,
} from "../services/clients";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
} from "../services/vehicles";

export default function ClientProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const clientId = Number(id);

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editClientOpen, setEditClientOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState<"add" | "edit">(
    "add",
  );
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);

  const fetchClient = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getClientById(clientId);
      setClient(data);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados do cliente.");
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (!Number.isNaN(clientId)) {
      fetchClient();
    }
  }, [clientId, fetchClient]);

  // ---------- Editar dados do cliente ----------
  async function handleSaveClient(data: ClientFormData) {
    setSavingClient(true);
    try {
      await updateClient(clientId, data);
      setEditClientOpen(false);
      await fetchClient();
    } catch (err: any) {
      alert(
        err?.response?.data?.erro ||
          err?.response?.data?.errors?.[0]?.message ||
          "Erro ao atualizar cliente.",
      );
    } finally {
      setSavingClient(false);
    }
  }

  // ---------- Veículos ----------
  function openAddVehicle() {
    setVehicleModalMode("add");
    setEditingVehicle(null);
    setVehicleModalOpen(true);
  }

  function openEditVehicle(vehicle: Vehicle) {
    setVehicleModalMode("edit");
    setEditingVehicle(vehicle);
    setVehicleModalOpen(true);
  }

  async function handleSaveVehicle(data: VehicleFormData) {
    if (data.ano === "") return;
    setSavingVehicle(true);
    try {
      if (vehicleModalMode === "edit" && editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          marca: data.marca,
          modelo: data.modelo,
          placa: data.placa,
          ano: data.ano,
        });
      } else {
        await createVehicle({
          cliente_id: clientId,
          marca: data.marca,
          modelo: data.modelo,
          placa: data.placa,
          ano: data.ano,
        });
      }
      setVehicleModalOpen(false);
      await fetchClient();
    } catch (err: any) {
      alert(
        err?.response?.data?.erro ||
          err?.response?.data?.errors?.[0]?.message ||
          "Erro ao salvar veículo.",
      );
    } finally {
      setSavingVehicle(false);
    }
  }

  async function handleDeleteVehicle(vehicle: Vehicle) {
    if (!confirm(`Remover o veículo ${vehicle.placa}?`)) return;
    try {
      await deleteVehicle(vehicle.id);
      await fetchClient();
    } catch (err) {
      console.error(err);
      alert("Erro ao remover veículo.");
    }
  }

  // ---------- Estados de carregamento ----------
  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center gap-2 text-sm text-gray-500">
        <Loader2 size={18} className="animate-spin" />
        Carregando cliente...
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="space-y-4 p-8 text-center">
        <p className="text-sm text-red-500">
          {error ?? "Cliente não encontrado."}
        </p>
        <Link
          to="/clientes"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar para Clientes
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">
            Perfil do Cliente:{" "}
            <span className="text-[#FF7518]">{client.nome}</span>
          </h1>
          <p className="text-sm text-gray-500">
            Documento: {client.documento}
          </p>
        </div>

        <Link
          to="/clientes"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar para Clientes
        </Link>
      </div>

      {/* Informações de contato */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <User size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">
                Informações de Contato
              </p>
              <p className="text-xs text-gray-500">Dados Pessoais</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setEditClientOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-4">
              <DisabledBadge label="Status desativado" />
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Nome
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <User size={14} className="text-gray-400" />
                  {client.nome}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Endereço
                </p>
                <div className="mt-1">
                  <DisabledBadge />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Telefone
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <Phone size={14} className="text-gray-400" />
                  {client.telefone}
                </p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Membro desde
                </p>
                <div className="mt-1">
                  <DisabledBadge />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Email
                </p>
                <div className="mt-1">
                  <DisabledBadge />
                </div>
              </div>
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Documento
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <IdCard size={14} className="text-gray-400" />
                  {client.documento}
                </p>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex flex-col gap-3 lg:w-52">
            <MiniStat
              icon={Car}
              label="Veículos"
              value={client.veiculos.length}
              accentColor="#FF7518"
            />
            <MiniStat
              icon={ClipboardList}
              label="Total gasto"
              value={<DisabledBadge />}
              accentColor="#10B981"
            />
            <MiniStat
              icon={ClipboardList}
              label="OS Feitas"
              value={<DisabledBadge />}
              accentColor="#2563EB"
            />
          </div>
        </div>
      </div>

      {/* Veículos matriculados */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Car size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">
                Veículos matriculados
              </p>
              <p className="text-xs text-gray-500">
                {client.veiculos.length} veículo(s) registrado(s)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={openAddVehicle}
            className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
          >
            <Plus size={14} />
            Adicionar veículo
          </button>
        </div>

        {client.veiculos.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Nenhum veículo cadastrado para este cliente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Marca / Modelo</th>
                  <th className="px-5 py-3 font-medium">Ano</th>
                  <th className="px-5 py-3 font-medium">Placa</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {client.veiculos.map((vehicle) => (
                  <tr
                    key={vehicle.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4">
                      <span className="flex items-center gap-2 font-medium text-[#1F1F1F]">
                        <Car size={14} className="text-[#FF7518]" />
                        {vehicle.marca} {vehicle.modelo}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-600">{vehicle.ano}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                        {vehicle.placa}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditVehicle(vehicle)}
                          aria-label="Editar"
                          className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteVehicle(vehicle)}
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

      {/* Histórico de serviço — ainda não integrado ao backend */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-100 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600">
              <History size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">
                Histórico de serviço
              </p>
              <p className="text-xs text-gray-500">
                Todas as ordens de serviço para este cliente
              </p>
            </div>
          </div>
          <DisabledBadge label="Em breve" />
        </div>

        <div className="p-10 text-center text-sm text-gray-400">
          Esta seção será conectada quando o módulo de Ordens de Serviço
          estiver disponível no backend.
        </div>
      </div>

      {/* Modal de edição do cliente */}
      <ClientFormModal
        mode="edit"
        open={editClientOpen}
        clientName={client.nome}
        initialData={{
          nome: client.nome,
          telefone: client.telefone,
          documento: client.documento,
        }}
        submitting={savingClient}
        onClose={() => setEditClientOpen(false)}
        onSave={handleSaveClient}
      />

      {/* Modal de veículo */}
      <VehicleFormModal
        mode={vehicleModalMode}
        open={vehicleModalOpen}
        initialData={
          editingVehicle
            ? {
                marca: editingVehicle.marca,
                modelo: editingVehicle.modelo,
                placa: editingVehicle.placa,
                ano: editingVehicle.ano,
              }
            : undefined
        }
        submitting={savingVehicle}
        onClose={() => setVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        onDelete={
          vehicleModalMode === "edit" && editingVehicle
            ? () => {
                handleDeleteVehicle(editingVehicle);
                setVehicleModalOpen(false);
              }
            : undefined
        }
      />
    </div>
  );
}

interface MiniStatProps {
  icon: typeof Car;
  label: string;
  value: React.ReactNode;
  accentColor: string;
}

function MiniStat({ icon: Icon, label, value, accentColor }: MiniStatProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
      >
        <Icon size={16} />
      </div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <div className="text-sm font-semibold text-[#1F1F1F]">{value}</div>
      </div>
    </div>
  );
}