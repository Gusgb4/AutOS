import { ClipboardList, DollarSign, Users, Wrench } from "lucide-react";
import StatCard from "../components/ui/StatCard";
import StatusBadge from "../components/ui/StatusBadge";

const recentOrders = [
  { id: "OS-1023", cliente: "João Silva", status: "em_andamento" as const },
  { id: "OS-1022", cliente: "Maria Souza", status: "concluido" as const },
  { id: "OS-1021", cliente: "Pedro Lima", status: "atrasado" as const },
  { id: "OS-1020", cliente: "Ana Costa", status: "pendente" as const },
];

export default function Dashboard() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Início</h1>
        <p className="text-sm text-gray-500">Visão geral da oficina</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Ordens abertas"
          value={12}
          icon={ClipboardList}
          trend={{ value: "+3 esta semana", positive: true }}
        />
        <StatCard
          label="Clientes ativos"
          value={87}
          icon={Users}
        />
        <StatCard
          label="Veículos em oficina"
          value={5}
          icon={Wrench}
          accentColor="#2563EB"
        />
        <StatCard
          label="Faturamento (mês)"
          value="R$ 24.350"
          icon={DollarSign}
          trend={{ value: "-2% vs mês anterior", positive: false }}
          accentColor="#10B981"
        />
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[#1F1F1F]">
          Ordens recentes
        </h2>
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b text-gray-500">
              <th className="pb-2">Código</th>
              <th className="pb-2">Cliente</th>
              <th className="pb-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {recentOrders.map((order) => (
              <tr key={order.id} className="border-b last:border-0">
                <td className="py-3 font-medium">{order.id}</td>
                <td className="py-3 text-gray-600">{order.cliente}</td>
                <td className="py-3">
                  <StatusBadge status={order.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}