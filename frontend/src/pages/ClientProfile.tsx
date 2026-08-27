import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  User,
  Pencil,
  Car,
  DollarSign,
  ClipboardList,
  Plus,
  Eye,
  History,
  Download,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";

interface Vehicle {
  id: string;
  modelo: string;
  ano: number;
  placa: string;
  cor: string;
  corHex: string;
  ultimoServico: string;
  ultimoServicoRelativo: string;
  destaque?: boolean;
}

interface ServiceOrder {
  id: string;
  data: string;
  dataRelativa: string;
  veiculo: string;
  veiculoPlaca: string;
  servicos: string;
  total: string;
  status: "pendente" | "em_andamento" | "concluido" | "cancelado" | "atrasado";
}

const mockVehicles: Vehicle[] = [
  {
    id: "1",
    modelo: "Toyota Camry",
    ano: 2019,
    placa: "ABC-1234",
    cor: "Azul Marinho",
    corHex: "#1E3A8A",
    ultimoServico: "14 de julho de 2025",
    ultimoServicoRelativo: "Hoje",
    destaque: true,
  },
  {
    id: "2",
    modelo: "Ford F-150",
    ano: 2021,
    placa: "XYZ-5678",
    cor: "Prata",
    corHex: "#C0C0C0",
    ultimoServico: "22 de maio de 2025",
    ultimoServicoRelativo: "53 dias atrás",
  },
];

const mockOrders: ServiceOrder[] = [
  {
    id: "#ORD-0147",
    data: "14 de julho de 2025",
    dataRelativa: "Hoje",
    veiculo: "Toyota Camry",
    veiculoPlaca: "ABC-1234",
    servicos: "3 items",
    total: "R$ 480,00",
    status: "em_andamento",
  },
  {
    id: "#ORD-0138",
    data: "22 de maio de 2025",
    dataRelativa: "53 dias atrás",
    veiculo: "Ford F-150",
    veiculoPlaca: "XYZ-5678",
    servicos: "5 items",
    total: "R$ 1.240,00",
    status: "concluido",
  },
  {
    id: "#ORD-0122",
    data: "10 de março de 2025",
    dataRelativa: "126 dias atrás",
    veiculo: "Toyota Camry",
    veiculoPlaca: "ABC-1234",
    servicos: "2 items",
    total: "R$ 320,00",
    status: "concluido",
  },
  {
    id: "#ORD-0109",
    data: "28 de janeiro de 2025",
    dataRelativa: "187 dias atrás",
    veiculo: "Ford F-150",
    veiculoPlaca: "XYZ-5678",
    servicos: "4 items",
    total: "R$ 890,00",
    status: "concluido",
  },
  {
    id: "#ORD-0094",
    data: "5 de novembro de 2024",
    dataRelativa: "251 dias atrás",
    veiculo: "Toyota Camry",
    veiculoPlaca: "ABC-1234",
    servicos: "1 item",
    total: "R$ 150,00",
    status: "cancelado",
  },
  {
    id: "#ORD-0081",
    data: "19 de agosto de 2024",
    dataRelativa: "329 dias atrás",
    veiculo: "Ford F-150",
    veiculoPlaca: "XYZ-5678",
    servicos: "6 items",
    total: "R$ 1.740,00",
    status: "concluido",
  },
];

export default function ClientProfile() {
  const { id } = useParams();

  // Mock — substituir por fetch real via services/ usando `id`
  const client = {
    nome: "João Silva",
    clienteDesde: "2023",
    status: "Cliente Ativo",
    telefone: "(47) 9234-5678",
    email: "joao@email.com",
    endereco: "Rua Horto Florestal, 111 - Boa Vista",
    membroDesde: "Janeiro 2023",
    totalVeiculos: 2,
    totalGasto: "R$4.820",
    osFeitas: 14,
  };

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
            Cliente desde {client.clienteDesde}
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
              <p className="text-xs text-gray-500">Dados Pessoais e Endereço</p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
          >
            <Pencil size={14} />
            Editar
          </button>
        </div>

        <div className="grid grid-cols-1 gap-6 p-5 lg:grid-cols-[1fr_auto]">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="space-y-4">
              <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-600">
                {client.status}
              </span>
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
                  <MapPin size={14} className="text-gray-400" />
                  {client.endereco}
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
                  Membro desde
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <Calendar size={14} className="text-gray-400" />
                  {client.membroDesde}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-400">
                  Email
                </p>
                <p className="mt-1 flex items-center gap-2 text-sm text-[#1F1F1F]">
                  <Mail size={14} className="text-gray-400" />
                  {client.email}
                </p>
              </div>
            </div>
          </div>

          {/* Mini stats */}
          <div className="flex flex-col gap-3 lg:w-52">
            <MiniStat
              icon={Car}
              label="Veículos"
              value={client.totalVeiculos}
              accentColor="#FF7518"
            />
            <MiniStat
              icon={DollarSign}
              label="Total gasto"
              value={client.totalGasto}
              accentColor="#10B981"
            />
            <MiniStat
              icon={ClipboardList}
              label="OS Feitas"
              value={client.osFeitas}
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
                {mockVehicles.length} veículos registrados
              </p>
            </div>
          </div>

          <button
            type="button"
            className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
          >
            <Plus size={14} />
            Adicionar veículo
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Modelo</th>
                <th className="px-5 py-3 font-medium">Ano</th>
                <th className="px-5 py-3 font-medium">Placa</th>
                <th className="px-5 py-3 font-medium">Cor</th>
                <th className="px-5 py-3 font-medium">Último serviço</th>
                <th className="px-5 py-3 text-right font-medium">Ações</th>
              </tr>
            </thead>
            <tbody>
              {mockVehicles.map((vehicle) => (
                <tr
                  key={vehicle.id}
                  className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                >
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 font-medium text-[#1F1F1F]">
                      <Car size={14} className="text-[#FF7518]" />
                      {vehicle.modelo}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-gray-600">{vehicle.ano}</td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-1 font-mono text-xs text-gray-600">
                      {vehicle.placa}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 text-gray-600">
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-gray-200"
                        style={{ backgroundColor: vehicle.corHex }}
                      />
                      {vehicle.cor}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-gray-700">{vehicle.ultimoServico}</p>
                    <p
                      className={`text-xs ${
                        vehicle.destaque
                          ? "font-medium text-emerald-600"
                          : "text-gray-400"
                      }`}
                    >
                      {vehicle.ultimoServicoRelativo}
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
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

          <div className="flex items-center gap-2">
            <span className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600">
              {mockOrders.length} pedidos
            </span>
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
            >
              <Download size={13} />
              Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                <th className="px-5 py-3 font-medium">Ordem #</th>
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Veículo</th>
                <th className="px-5 py-3 font-medium">Serviços</th>
                <th className="px-5 py-3 font-medium">Total</th>
                <th className="px-5 py-3 font-medium">Status</th>
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
                    <p className="text-gray-700">{order.data}</p>
                    <p className="text-xs text-gray-400">
                      {order.dataRelativa}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="flex items-center gap-2 text-gray-700">
                      <Car size={13} className="text-gray-400" />
                      {order.veiculo}
                    </span>
                    <p className="pl-5 text-xs text-gray-400">
                      {order.veiculoPlaca}
                    </p>
                  </td>
                  <td className="px-5 py-4">
                    <span className="rounded-md bg-gray-100 px-2 py-1 text-xs text-gray-600">
                      {order.servicos}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                    {order.total}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between border-t border-gray-100 p-4">
          <p className="text-xs text-gray-500">
            Exibindo 1-6 de {client.osFeitas} pedidos
          </p>

          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 disabled:opacity-40"
              disabled
            >
              <ChevronLeft size={16} />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#FF7518] text-sm font-medium text-white"
            >
              1
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              2
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-sm text-gray-600 hover:bg-gray-100"
            >
              3
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MiniStatProps {
  icon: typeof Car;
  label: string;
  value: string | number;
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
        <p className="text-sm font-semibold text-[#1F1F1F]">{value}</p>
      </div>
    </div>
  );
}