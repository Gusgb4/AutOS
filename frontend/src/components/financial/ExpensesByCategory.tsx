import { Loader2, PieChart } from "lucide-react";
import {
  categoriaLabel,
  type DespesasPorCategoria,
} from "../../services/financial";

interface ExpensesByCategoryProps {
  dados: DespesasPorCategoria | null;
  erro: string | null;
  periodo: string;
  formatarValor: (valor: number) => string;
}

export default function ExpensesByCategory({
  dados,
  erro,
  periodo,
  formatarValor,
}: ExpensesByCategoryProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500">
            <PieChart size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">
              Despesas por categoria
            </p>
            <p className="text-xs text-gray-500">{periodo}</p>
          </div>
        </div>
        {dados && dados.total > 0 && (
          <span className="text-sm font-semibold text-red-500">
            {formatarValor(dados.total)}
          </span>
        )}
      </div>

      {erro ? (
        <p className="p-6 text-center text-sm text-red-500">{erro}</p>
      ) : !dados ? (
        <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
          <Loader2 size={15} className="animate-spin" />
          Carregando despesas...
        </div>
      ) : dados.categorias.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-400">
          Nenhuma despesa no período.
        </p>
      ) : (
        <ul className="flex flex-col gap-4 p-5">
          {dados.categorias.map((c) => (
            <li key={c.categoria} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-[#1F1F1F]">
                  {categoriaLabel(c.categoria)}
                </span>
                <span className="text-gray-600">
                  {formatarValor(c.valor)}{" "}
                  <span className="ml-1 inline-block w-12 text-right text-xs font-semibold text-gray-400">
                    {c.percentual.toLocaleString("pt-BR")}%
                  </span>
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-red-400"
                  style={{ width: `${c.percentual}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
