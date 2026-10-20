import { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Users,
  UserPlus,
  Car,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  Plus,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import ToolbarMenu from "../components/ui/ToolbarMenu";
import { isMaintenanceOverdue } from "../lib/maintenance";
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
  buildClientPayload,
  type Client,
} from "../services/clients";
import { listServiceOrders } from "../services/serviceOrders";
import { mensagemDeErro } from "../lib/errors";
import { getUserRole } from "../lib/auth";

type FiltroVeiculos = "todos" | "com" | "sem";
type FiltroEmail = "todos" | "com" | "sem";
type FiltroGasto = "todos" | "sem-os" | "ate-500" | "500-2000" | "acima-2000";
type Ordenacao =
  | "nome-asc"
  | "nome-desc"
  | "recentes"
  | "antigos"
  | "veiculos"
  | "mais-gasto"
  | "ultima-visita";

const ORDENACOES: { value: Ordenacao; label: string }[] = [
  { value: "nome-asc", label: "Nome (A → Z)" },
  { value: "nome-desc", label: "Nome (Z → A)" },
  { value: "recentes", label: "Mais recentes" },
  { value: "antigos", label: "Mais antigos" },
  { value: "veiculos", label: "Mais veículos" },
  { value: "mais-gasto", label: "Mais gasto" },
  { value: "ultima-visita", label: "Última visita" },
];

const FAIXAS_GASTO: { value: FiltroGasto; label: string }[] = [
  { value: "todos", label: "Todos" },
  { value: "sem-os", label: "Sem OS" },
  { value: "ate-500", label: "Até R$ 500" },
  { value: "500-2000", label: "De R$ 500 a R$ 2.000" },
  { value: "acima-2000", label: "Acima de R$ 2.000" },
];

// "sem OS" = nenhuma OS finalizada; as faixas valem para quem já gastou algo
function dentroDaFaixa(cliente: Client, faixa: FiltroGasto) {
  const gasto = cliente.total_gasto ?? 0;
  const temOs = (cliente.qtd_os ?? 0) > 0;
  switch (faixa) {
    case "sem-os":
      return !temOs;
    case "ate-500":
      return temOs && gasto <= 500;
    case "500-2000":
      return temOs && gasto > 500 && gasto <= 2000;
    case "acima-2000":
      return temOs && gasto > 2000;
    default:
      return true;
  }
}

// Compara marcas sem diferenciar maiúsculas, acentos e espaços ("FIAT" = "Fiat ")
function chaveMarca(marca: string) {
  return marca
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function Clients() {
  const navigate = useNavigate();
  // Funcionário cadastra e consulta; editar e arquivar é só do proprietário
  const podeEditar = getUserRole() === "PROPRIETARIO";
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [ordensAtivas, setOrdensAtivas] = useState(0);

  // Filtros e ordenação (aplicados sobre a lista já carregada)
  const [filtroVeiculos, setFiltroVeiculos] = useState<FiltroVeiculos>("todos");
  const [filtroEmail, setFiltroEmail] = useState<FiltroEmail>("todos");
  const [apenasRevisaoVencida, setApenasRevisaoVencida] = useState(false);
  const [filtroGasto, setFiltroGasto] = useState<FiltroGasto>("todos");
  const [filtroMarca, setFiltroMarca] = useState("");
  const [ordenacao, setOrdenacao] = useState<Ordenacao>("nome-asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchClients = useCallback(async (termo?: string) => {
    setLoading(true);
    setError(null);
    try {
      // O backend já devolve só clientes e veículos ativos
      setClients(await listClients(termo));
    } catch (err) {
      console.error(err);
      setError("Não foi possível carregar os clientes.");
    } finally {
      setLoading(false);
    }
  }, []);

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

  useEffect(() => {
    listServiceOrders()
      .then((ordens) => {
        setOrdensAtivas(
          ordens.filter(
            (o) => o.status === "ABERTA" || o.status === "EM_ANDAMENTO",
          ).length,
        );
      })
      .catch((err) => console.error(err));
  }, []);

  async function handleSave(data: ClientFormData, vehicle?: NewVehicleData) {
    setSubmitting(true);
    try {
      if (modalMode === "edit" && editingClient) {
        await updateClient(editingClient.id, buildClientPayload(data));
      } else {
        const newClient = await createClient(buildClientPayload(data));
        if (vehicle) {
          try {
            await createVehicle({
              cliente_id: newClient.id,
              marca: vehicle.marca,
              modelo: vehicle.modelo,
              placa: vehicle.placa,
              ano: vehicle.ano,
            });
          } catch (vehicleErr) {
            // Cliente já foi criado; avisa mas não desfaz o cadastro
            alert(
              "Cliente criado, mas houve um erro ao cadastrar o veículo: " +
                mensagemDeErro(vehicleErr, "erro desconhecido."),
            );
          }
        }
      }
      setModalOpen(false);
      await fetchClients(search || undefined);
    } catch (err) {
      alert(mensagemDeErro(err, "Erro ao salvar cliente."));
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

  const filtrosAtivos =
    (filtroVeiculos !== "todos" ? 1 : 0) +
    (filtroEmail !== "todos" ? 1 : 0) +
    (apenasRevisaoVencida ? 1 : 0) +
    (filtroGasto !== "todos" ? 1 : 0) +
    (filtroMarca ? 1 : 0);

  function limparFiltros() {
    setFiltroVeiculos("todos");
    setFiltroEmail("todos");
    setApenasRevisaoVencida(false);
    setFiltroGasto("todos");
    setFiltroMarca("");
  }

  // Marcas dos veículos carregados, sem repetir variações de escrita
  const marcas = useMemo(() => {
    const porChave = new Map<string, string>();
    for (const c of clients) {
      for (const v of c.veiculos) {
        const chave = chaveMarca(v.marca);
        if (chave && !porChave.has(chave)) porChave.set(chave, v.marca.trim());
      }
    }
    return [...porChave.entries()]
      .map(([chave, label]) => ({ chave, label }))
      .sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));
  }, [clients]);

  const clientesExibidos = useMemo(() => {
    const filtrados = clients.filter((c) => {
      if (filtroVeiculos === "com" && c.veiculos.length === 0) return false;
      if (filtroVeiculos === "sem" && c.veiculos.length > 0) return false;
      if (filtroEmail === "com" && !c.email) return false;
      if (filtroEmail === "sem" && c.email) return false;
      if (apenasRevisaoVencida && !c.veiculos.some(isMaintenanceOverdue)) {
        return false;
      }
      if (!dentroDaFaixa(c, filtroGasto)) return false;
      if (
        filtroMarca &&
        !c.veiculos.some((v) => chaveMarca(v.marca) === filtroMarca)
      ) {
        return false;
      }
      return true;
    });

    const porNome = (a: Client, b: Client) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" });
    const visita = (c: Client) =>
      c.ultima_visita ? new Date(c.ultima_visita).getTime() : -Infinity;

    return [...filtrados].sort((a, b) => {
      switch (ordenacao) {
        case "nome-desc":
          return b.nome.localeCompare(a.nome, "pt-BR", { sensitivity: "base" });
        case "recentes":
          return (
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
        case "antigos":
          return (
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        case "veiculos":
          return b.veiculos.length - a.veiculos.length;
        case "mais-gasto":
          return (b.total_gasto ?? 0) - (a.total_gasto ?? 0) || porNome(a, b);
        case "ultima-visita":
          // Mais recente primeiro; quem nunca veio fica no fim
          return visita(b) - visita(a) || porNome(a, b);
        default:
          return porNome(a, b);
      }
    });
  }, [
    clients,
    filtroVeiculos,
    filtroEmail,
    apenasRevisaoVencida,
    filtroGasto,
    filtroMarca,
    ordenacao,
  ]);

  const totalVeiculos = clients.reduce((acc, c) => acc + c.veiculos.length, 0);
  const agora = new Date();
  const novosNesteMes = clients.filter((c) => {
    const data = new Date(c.created_at);
    return (
      data.getMonth() === agora.getMonth() &&
      data.getFullYear() === agora.getFullYear()
    );
  }).length;

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
          label="TOTAL DE CLIENTES"
          value={clients.length}
          icon={Users}
          accentColor="#FF7518"
        />
        <StatCard
          label="TOTAL DE VEÍCULOS"
          value={totalVeiculos}
          icon={Car}
          accentColor="#A855F7"
        />
        <StatCard
          label="NOVOS NESTE MÊS"
          value={novosNesteMes}
          icon={UserPlus}
          accentColor="#10B981"
        />
        <StatCard
          label="ORDENS ATIVAS"
          value={ordensAtivas}
          icon={ClipboardList}
          accentColor="#2563EB"
        />
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
              placeholder="Buscar por nome/placa..."
              className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#FF7518]"
            />
          </div>

          <ToolbarMenu
            label="Filtro"
            icon={SlidersHorizontal}
            activeCount={filtrosAtivos}
          >
            <div className="space-y-4">
              <MenuGroup label="Veículos">
                <MenuChoice
                  checked={filtroVeiculos === "todos"}
                  onSelect={() => setFiltroVeiculos("todos")}
                >
                  Todos
                </MenuChoice>
                <MenuChoice
                  checked={filtroVeiculos === "com"}
                  onSelect={() => setFiltroVeiculos("com")}
                >
                  Com veículo
                </MenuChoice>
                <MenuChoice
                  checked={filtroVeiculos === "sem"}
                  onSelect={() => setFiltroVeiculos("sem")}
                >
                  Sem veículo
                </MenuChoice>
              </MenuGroup>

              <MenuGroup label="Email">
                <MenuChoice
                  checked={filtroEmail === "todos"}
                  onSelect={() => setFiltroEmail("todos")}
                >
                  Todos
                </MenuChoice>
                <MenuChoice
                  checked={filtroEmail === "com"}
                  onSelect={() => setFiltroEmail("com")}
                >
                  Com email
                </MenuChoice>
                <MenuChoice
                  checked={filtroEmail === "sem"}
                  onSelect={() => setFiltroEmail("sem")}
                >
                  Sem email
                </MenuChoice>
              </MenuGroup>

              <MenuGroup label="Manutenção">
                <MenuChoice
                  checked={!apenasRevisaoVencida}
                  onSelect={() => setApenasRevisaoVencida(false)}
                >
                  Todos
                </MenuChoice>
                <MenuChoice
                  checked={apenasRevisaoVencida}
                  onSelect={() => setApenasRevisaoVencida(true)}
                >
                  Revisão vencida
                </MenuChoice>
              </MenuGroup>

              <MenuGroup label="Total gasto">
                {FAIXAS_GASTO.map((f) => (
                  <MenuChoice
                    key={f.value}
                    checked={filtroGasto === f.value}
                    onSelect={() => setFiltroGasto(f.value)}
                  >
                    {f.label}
                  </MenuChoice>
                ))}
              </MenuGroup>

              {marcas.length > 0 && (
                <MenuGroup label="Marca do veículo">
                  <div className="max-h-44 space-y-0.5 overflow-y-auto">
                    <MenuChoice
                      checked={!filtroMarca}
                      onSelect={() => setFiltroMarca("")}
                    >
                      Todas
                    </MenuChoice>
                    {marcas.map((m) => (
                      <MenuChoice
                        key={m.chave}
                        checked={filtroMarca === m.chave}
                        onSelect={() => setFiltroMarca(m.chave)}
                      >
                        {m.label}
                      </MenuChoice>
                    ))}
                  </div>
                </MenuGroup>
              )}

              {filtrosAtivos > 0 && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="w-full rounded-lg border border-gray-200 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </ToolbarMenu>

          <ToolbarMenu label="Organizar" icon={ArrowUpDown}>
            <MenuGroup label="Ordenar por">
              {ORDENACOES.map((o) => (
                <MenuChoice
                  key={o.value}
                  checked={ordenacao === o.value}
                  onSelect={() => setOrdenacao(o.value)}
                >
                  {o.label}
                </MenuChoice>
              ))}
            </MenuGroup>
          </ToolbarMenu>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="flex items-center justify-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
        >
          <Plus size={16} />
          Adicionar Cliente
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
              <p className="font-semibold text-[#1F1F1F]">Clientes</p>
              <p className="text-xs text-gray-500">
                Mostrando {clientesExibidos.length} de {clients.length} clientes
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
        ) : clientesExibidos.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Nenhum cliente encontrado.
            {filtrosAtivos > 0 && (
              <>
                {" "}
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="font-medium text-[#FF7518] hover:underline"
                >
                  Limpar filtros
                </button>
              </>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Cliente</th>
                  <th className="px-5 py-3 font-medium">Telefone</th>
                  <th className="px-5 py-3 font-medium">Email</th>
                  <th className="px-5 py-3 font-medium">Veículos</th>
                  <th className="px-5 py-3 font-medium">Total gasto</th>
                  <th className="px-5 py-3 font-medium">Última visita</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientesExibidos.map((client) => (
                  <tr
                    onClick={() => navigate(`/clientes/${client.id}`)}
                    key={client.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-100/60"
                  >
                    <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                      {client.nome}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {client.telefone}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {client.email || (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 text-gray-600">
                          <Car size={14} className="text-[#FF7518]" />
                          {client.veiculos.length}
                        </span>
                        {client.veiculos.some(isMaintenanceOverdue) && (
                          <span
                            title="Há veículo com revisão vencida"
                            className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-semibold text-red-600"
                          >
                            <AlertTriangle size={11} />
                            Revisão vencida
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-[#1F1F1F]">
                        {formatCurrency(client.total_gasto ?? 0)}
                      </p>
                      <p className="text-xs text-gray-400">
                        {client.qtd_os ?? 0}{" "}
                        {(client.qtd_os ?? 0) === 1 ? "OS finalizada" : "OS finalizadas"}
                      </p>
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {client.ultima_visita ? (
                        new Date(client.ultima_visita).toLocaleDateString("pt-BR")
                      ) : (
                        <span className="text-xs text-gray-300">Nunca</span>
                      )}
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
                        {podeEditar && (
                          <>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(client);
                              }}
                              aria-label="Editar"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100"
                            >
                              <Pencil size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteDirect(client);
                              }}
                              aria-label="Excluir"
                              className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
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
                email: editingClient.email ?? "",
                endereco: editingClient.endereco ?? "",
              }
            : undefined
        }
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={
          modalMode === "edit" && podeEditar ? handleDelete : undefined
        }
      />
    </div>
  );
}

function MenuGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function MenuChoice({
  checked,
  onSelect,
  children,
}: {
  checked: boolean;
  onSelect: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-gray-50 ${
        checked ? "font-medium text-[#1F1F1F]" : "text-gray-600"
      }`}
    >
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
          checked ? "border-[#FF7518]" : "border-gray-300"
        }`}
      >
        {checked && <span className="h-2 w-2 rounded-full bg-[#FF7518]" />}
      </span>
      {children}
    </button>
  );
}