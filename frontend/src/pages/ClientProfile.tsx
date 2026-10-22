import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  CalendarDays,
  User,
  Pencil,
  Car,
  ClipboardList,
  Plus,
  Trash2,
  History,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import StatusBadge from "../components/ui/StatusBadge";
import ClientFormModal, {
  type ClientFormData,
} from "../components/clients/ClientFormModal";
import VehicleFormModal, {
  type VehicleFormData,
} from "../components/clients/VehicleFormModal";
import RemoverDadosCard from "../components/clients/RemoverDadosCard";
import {
  getClientById,
  updateClient,
  buildClientPayload,
  type Client,
} from "../services/clients";
import {
  createVehicle,
  updateVehicle,
  deleteVehicle,
  type Vehicle,
} from "../services/vehicles";

import {
  listServiceOrders,
  type ServiceOrder,
} from "../services/serviceOrders";
import { mensagemDeErro } from "../lib/errors";
import { getUserRole } from "../lib/auth";
import { isLembreteVencido } from "../lib/maintenance";

function formatCurrency(value: string | number) {
  return Number(value).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("pt-BR");
}

export default function ClientProfile() {
  const { id } = useParams();
  const clientId = Number(id);
  // Funcionário cadastra e consulta; editar e arquivar é só do proprietário
  const podeEditar = getUserRole() === "PROPRIETARIO";
  const navigate = useNavigate();

  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Histórico de OS tem estado próprio: se falhar, o resto do perfil continua
  const [ordens, setOrdens] = useState<ServiceOrder[]>([]);
  const [loadingOrdens, setLoadingOrdens] = useState(true);
  const [errorOrdens, setErrorOrdens] = useState<string | null>(null);

  const [editClientOpen, setEditClientOpen] = useState(false);
  const [savingClient, setSavingClient] = useState(false);

  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const [vehicleModalMode, setVehicleModalMode] = useState<"add" | "edit">(
    "add",
  );
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [savingVehicle, setSavingVehicle] = useState(false);

  // Recarrega o cliente (usado depois de salvar/remover algo)
  const fetchClient = useCallback(async () => {
    try {
      const data = await getClientById(clientId);
      setClient(data);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os dados do cliente.");
    }
  }, [clientId]);

  // Carga inicial (e quando o id da URL muda)
  useEffect(() => {
    if (Number.isNaN(clientId)) return;

    let ativo = true;
    getClientById(clientId)
      .then((data) => {
        if (!ativo) return;
        setClient(data);
        setError(null);
      })
      .catch((err) => {
        if (!ativo) return;
        console.error(err);
        setError("Não foi possível carregar os dados do cliente.");
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    // Histórico de OS carrega à parte: se falhar, o resto do perfil continua
    listServiceOrders(undefined, clientId)
      .then((data) => {
        if (!ativo) return;
        setOrdens(data);
        setErrorOrdens(null);
      })
      .catch((err) => {
        if (!ativo) return;
        console.error(err);
        setErrorOrdens("Não foi possível carregar o histórico de serviço.");
      })
      .finally(() => {
        if (ativo) setLoadingOrdens(false);
      });

    return () => {
      ativo = false;
    };
  }, [clientId]);


  // ---------- Editar dados do cliente ----------
  async function handleSaveClient(data: ClientFormData) {
    setSavingClient(true);
    try {
      await updateClient(clientId, buildClientPayload(data));
      setEditClientOpen(false);
      await fetchClient();
    } catch (err) {
      alert(mensagemDeErro(err, "Erro ao atualizar cliente."));
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

    const quilometragem_atual =
      data.quilometragem_atual !== ""
        ? Number(data.quilometragem_atual)
        : undefined;
    // O formulário já exige os campos; aqui só converte para número
    const lembretes = data.lembretes.map((l) => ({
      id: l.id,
      nome: l.nome.trim(),
      intervalo_dias: Number(l.intervalo_dias),
      intervalo_km: Number(l.intervalo_km),
    }));

    setSavingVehicle(true);
    try {
      if (vehicleModalMode === "edit" && editingVehicle) {
        await updateVehicle(editingVehicle.id, {
          marca: data.marca,
          modelo: data.modelo,
          placa: data.placa,
          cor: data.cor.trim(),
          ano: data.ano,
          quilometragem_atual,
          lembretes,
        });
      } else {
        await createVehicle({
          cliente_id: clientId,
          marca: data.marca,
          modelo: data.modelo,
          placa: data.placa,
          cor: data.cor.trim(),
          ano: data.ano,
          quilometragem_atual,
          lembretes,
        });
      }
      setVehicleModalOpen(false);
      await fetchClient();
    } catch (err) {
      alert(mensagemDeErro(err, "Erro ao salvar veículo."));
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

  // ---------- Resumo das OS (apenas finalizadas) ----------
  // valor_total chega da API como string (Decimal do Prisma)
  const ordensFinalizadas = ordens.filter((o) => o.status === "FINALIZADA");
  const totalGasto = ordensFinalizadas.reduce(
    (acc, o) => acc + Number(o.valor_total),
    0,
  );

  function resumoOrdens(valor: React.ReactNode) {
    if (loadingOrdens) {
      return <Loader2 size={14} className="animate-spin text-gray-400" />;
    }
    return errorOrdens ? "—" : valor;
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

  // Dados apagados a pedido do titular: o perfil fica só pra consultar o histórico
  const anonimizado = Boolean(client.anonimizado_em);

  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col items-start gap-3 md:flex-row md:justify-between md:gap-0">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">
            Perfil do Cliente:{" "}
            <span className="text-[#FF7518]">{client.nome}</span>
          </h1>
        </div>

        <Link
          to="/clientes"
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
        >
          <ArrowLeft size={15} />
          Voltar para Clientes
        </Link>
      </div>

      {client.anonimizado_em && (
        <div className="flex items-start gap-3 rounded-2xl bg-gray-100 p-5 text-sm text-gray-600">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-gray-500" />
          <p>
            Os dados pessoais deste cliente foram removidos em{" "}
            {formatDate(client.anonimizado_em)} a pedido dele (LGPD). O
            histórico de serviço foi mantido sem identificar a pessoa.
          </p>
        </div>
      )}

      {/* Informações de contato */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 md:flex-nowrap md:gap-0">
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

          {podeEditar && !anonimizado && (
            <button
              type="button"
              onClick={() => setEditClientOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
            >
              <Pencil size={14} />
              Editar
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-4">
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
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <MapPin size={14} className="shrink-0 text-gray-400" />
                  {client.endereco || (
                    <span className="text-gray-300">Não informado</span>
                  )}
                </p>
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
                  Cliente desde
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <CalendarDays size={14} className="text-gray-400" />
                  {client.created_at
                    ? new Date(client.created_at).toLocaleDateString("pt-BR")
                    : "—"}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Email
                </p>
                <p className="mt-1 flex items-center gap-2 break-all text-sm text-[#1F1F1F]">
                  <Mail size={14} className="shrink-0 text-gray-400" />
                  {client.email || (
                    <span className="text-gray-300">Não informado</span>
                  )}
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
              value={resumoOrdens(formatCurrency(totalGasto))}
              accentColor="#10B981"
            />
            <MiniStat
              icon={ClipboardList}
              label="OS Feitas"
              value={resumoOrdens(ordensFinalizadas.length)}
              accentColor="#2563EB"
            />
          </div>
        </div>
      </div>

      {/* Veículos matriculados */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5 md:flex-nowrap md:gap-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 text-purple-600">
              <Car size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">Veículos</p>
              <p className="text-xs text-gray-500">
                {client.veiculos.length} veículo(s) registrado(s)
              </p>
            </div>
          </div>

          {!anonimizado && (
            <button
              type="button"
              onClick={openAddVehicle}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
            >
              <Plus size={14} />
              Adicionar veículo
            </button>
          )}
        </div>

        {client.veiculos.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">
            Nenhum veículo cadastrado para este cliente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm md:whitespace-normal">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Marca / Modelo</th>
                  <th className="px-5 py-3 font-medium">Ano</th>
                  <th className="px-5 py-3 font-medium">Placa</th>
                  <th className="px-5 py-3 font-medium">Quilometragem</th>
                  {""}
                  {podeEditar && (
                    <th className="px-5 py-3 text-right font-medium">Ações</th>
                  )}
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
                        {vehicle.cor && (
                          <span className="font-normal text-gray-400">
                            · {vehicle.cor}
                          </span>
                        )}
                      </span>
                      <MaintenanceInfo vehicle={vehicle} />
                    </td>
                    <td className="px-5 py-4 text-gray-600">{vehicle.ano}</td>
                    <td className="px-5 py-4">
                      <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                        {vehicle.placa}
                      </span>
                    </td>

                    {/* KM */}
                    <td className="px-5 py-4 text-gray-600 font-medium">
                      {vehicle.quilometragem_atual != null
                        ? `${Number(vehicle.quilometragem_atual).toLocaleString("pt-BR")} km`
                        : "0 km"}
                    </td>

                    {podeEditar && (
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-3 md:gap-2">
                          <button
                            type="button"
                            onClick={() => openEditVehicle(vehicle)}
                            aria-label="Editar"
                            className="flex h-11 w-11 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 md:h-8 md:w-8"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVehicle(vehicle)}
                            aria-label="Arquivar"
                            className="flex h-11 w-11 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 md:h-8 md:w-8"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Histórico de serviço */}
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
        </div>

        {loadingOrdens ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando histórico...
          </div>
        ) : errorOrdens ? (
          <div className="p-10 text-center text-sm text-red-500">
            {errorOrdens}
          </div>
        ) : ordens.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Nenhuma ordem de serviço registrada para este cliente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap text-left text-sm md:whitespace-normal">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Ordem</th>
                  <th className="px-5 py-3 font-medium">Data de abertura</th>
                  <th className="px-5 py-3 font-medium">Veículo</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Valor total</th>
                </tr>
              </thead>
              <tbody>
                {ordens.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/ordens-servico/${order.id}`)}
                    className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#FF7518]">
                      #OS-{order.id}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-gray-700">
                        {order.veiculo?.marca} {order.veiculo?.modelo}
                      </p>
                      <p className="text-xs text-gray-400">
                        {order.veiculo?.placa}
                      </p>
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

      {podeEditar && !anonimizado && (
        <RemoverDadosCard clienteId={clientId} onRemovido={fetchClient} />
      )}

      {/* Modal de edição do cliente */}
      <ClientFormModal
        mode="edit"
        open={editClientOpen}
        clientName={client.nome}
        initialData={{
          nome: client.nome,
          telefone: client.telefone,
          email: client.email ?? "",
          endereco: client.endereco ?? "",
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
                cor: editingVehicle.cor ?? "",
                ano: editingVehicle.ano,
                quilometragem_atual: editingVehicle.quilometragem_atual ?? "",
                lembretes: (editingVehicle.lembretes ?? []).map((l) => ({
                  id: l.id,
                  nome: l.nome,
                  intervalo_dias: l.intervalo_dias,
                  intervalo_km: l.intervalo_km,
                })),
              }
            : undefined
        }
        submitting={savingVehicle}
        onClose={() => setVehicleModalOpen(false)}
        onSave={handleSaveVehicle}
        onDelete={
          podeEditar && vehicleModalMode === "edit" && editingVehicle
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

// Uma linha por lembrete, com o vencido em vermelho
function MaintenanceInfo({ vehicle }: { vehicle: Vehicle }) {
  const lembretes = vehicle.lembretes ?? [];
  if (lembretes.length === 0) return null;

  return (
    <span className="mt-1 block space-y-0.5">
      {lembretes.map((l) => {
        const vencido = isLembreteVencido(l, vehicle.quilometragem_atual);
        return (
          <span
            key={l.id}
            className={`block text-xs ${
              vencido ? "font-semibold text-red-600" : "text-gray-500"
            }`}
          >
            {l.nome}: {vencido ? "vencido " : "próximo "}
            {new Date(l.proxima_data).toLocaleDateString("pt-BR")} ou{" "}
            {Number(l.proximo_km).toLocaleString("pt-BR")} km
          </span>
        );
      })}
    </span>
  );
}