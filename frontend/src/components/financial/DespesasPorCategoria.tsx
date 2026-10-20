import { PieChart } from "lucide-react";
import {
  CATEGORIA_LABEL,
  type ResumoFinanceiro,
} from "../../services/financial";

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface DespesasPorCategoriaProps {
  itens: ResumoFinanceiro["despesas_por_categoria"];
  ocultarValores: boolean;
}

// Mesmo período dos cards do topo (filtro ou mês atual)
export default function DespesasPorCategoria({
  itens,
  ocultarValores,
}: DespesasPorCategoriaProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 p-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
          <PieChart size={18} />
        </div>
        <div>
          <p className="font-semibold text-[#1F1F1F]">Despesas por categoria</p>
          <p className="text-xs text-gray-500">No período dos cards acima</p>
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">
          Nenhuma despesa no período.
        </p>
      ) : (
        <ul className="space-y-4 p-5">
          {itens.map((item) => (
            <li key={item.categoria}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-[#1F1F1F]">
                  {CATEGORIA_LABEL[item.categoria]}
                </span>
                <span className="text-gray-600">
                  {ocultarValores ? "•••••" : moeda(item.valor)}{" "}
                  <span className="text-xs text-gray-400">
                    ({item.percentual.toLocaleString("pt-BR")}%)
                  </span>
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${item.percentual}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
