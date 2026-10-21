import type { LucideIcon } from "lucide-react";

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export interface ItemDistribuicao {
  chave: string;
  rotulo: string;
  valor: number;
  percentual: number;
}

interface DistribuicaoCardProps {
  titulo: string;
  subtitulo: string;
  icone: LucideIcon;
  // Classes do ícone e da barra, ex.: "bg-red-50 text-red-500" e "bg-red-400"
  corIcone: string;
  corBarra: string;
  vazio: string;
  itens: ItemDistribuicao[];
  ocultarValores: boolean;
}

// Barras horizontais com valor e %: despesas por categoria, recebido por forma etc.
export default function DistribuicaoCard({
  titulo,
  subtitulo,
  icone: Icone,
  corIcone,
  corBarra,
  vazio,
  itens,
  ocultarValores,
}: DistribuicaoCardProps) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-gray-100 p-5">
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${corIcone}`}
        >
          <Icone size={18} />
        </div>
        <div>
          <p className="font-semibold text-[#1F1F1F]">{titulo}</p>
          <p className="text-xs text-gray-500">{subtitulo}</p>
        </div>
      </div>

      {itens.length === 0 ? (
        <p className="p-6 text-center text-sm text-gray-500">{vazio}</p>
      ) : (
        <ul className="space-y-4 p-5">
          {itens.map((item) => (
            <li key={item.chave}>
              <div className="mb-1 flex items-center justify-between text-sm">
                <span className="font-medium text-[#1F1F1F]">
                  {item.rotulo}
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
                  className={`h-full rounded-full ${corBarra}`}
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
