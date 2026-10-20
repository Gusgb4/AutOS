import { useEffect, useState } from "react";
import { BarChart3, EyeOff, Loader2 } from "lucide-react";
import { getEvolucaoMensal, type EvolucaoMes } from "../../services/reports";

const MESES = [
  "jan", "fev", "mar", "abr", "mai", "jun",
  "jul", "ago", "set", "out", "nov", "dez",
];

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// "2026-10" vira "out/26"
function rotuloMes(mes: string) {
  const [ano, numero] = mes.split("-");
  return `${MESES[Number(numero) - 1]}/${ano.slice(2)}`;
}

interface EvolucaoChartProps {
  ocultarValores: boolean;
}

export default function EvolucaoChart({ ocultarValores }: EvolucaoChartProps) {
  const [dados, setDados] = useState<EvolucaoMes[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    getEvolucaoMensal()
      .then((d) => {
        if (ativo) setDados(d);
      })
      .catch(() => {
        if (ativo) setErro(true);
      });
    return () => {
      ativo = false;
    };
  }, []);

  // A maior barra dos 12 meses ocupa a altura toda; as outras são proporcionais
  const maximo = Math.max(
    1,
    ...(dados ?? []).flatMap((d) => [d.faturado, d.recebido]),
  );

  // Valor pequeno ainda aparece como um tracinho, em vez de sumir
  function altura(valor: number) {
    if (valor <= 0) return "0%";
    return `${Math.max(2, (valor / maximo) * 100)}%`;
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#FF7518]">
            <BarChart3 size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Faturado × recebido</p>
            <p className="text-xs text-gray-500">Últimos 12 meses</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-[#FF7518]" />
            Faturado (OS finalizadas)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-500" />
            Recebido (pagamentos)
          </span>
        </div>
      </div>

      {ocultarValores ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-400">
          <EyeOff size={16} />
          Valores ocultos
        </div>
      ) : erro ? (
        <p className="p-10 text-center text-sm text-red-500">
          Não foi possível carregar o gráfico.
        </p>
      ) : !dados ? (
        <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Carregando gráfico...
        </div>
      ) : (
        // No celular o gráfico rola para o lado em vez de espremer as barras
        <div className="overflow-x-auto p-5">
          <div className="flex h-52 min-w-[640px] items-end gap-3">
            {dados.map((d) => (
              <div
                key={d.mes}
                className="flex h-full flex-1 flex-col items-center gap-2"
              >
                <div className="flex w-full flex-1 items-end justify-center gap-1">
                  <div
                    className="w-1/3 rounded-t bg-[#FF7518] transition-all"
                    style={{ height: altura(d.faturado) }}
                    title={`Faturado em ${rotuloMes(d.mes)}: ${moeda(d.faturado)}`}
                  />
                  <div
                    className="w-1/3 rounded-t bg-emerald-500 transition-all"
                    style={{ height: altura(d.recebido) }}
                    title={`Recebido em ${rotuloMes(d.mes)}: ${moeda(d.recebido)}`}
                  />
                </div>
                <span className="text-[11px] text-gray-500">
                  {rotuloMes(d.mes)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
