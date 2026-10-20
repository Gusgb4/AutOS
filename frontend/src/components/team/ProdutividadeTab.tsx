import { useEffect, useState } from "react";
import {
  ClipboardList,
  DollarSign,
  Wrench,
  Receipt,
  TrendingUp,
  Loader2,
} from "lucide-react";
import StatCard from "../ui/StatCard";
import { PERFIL_LABEL } from "../../lib/auth";
import { mensagemDeErro } from "../../lib/errors";
import { getProdutividade, type Produtividade } from "../../services/users";

function formatCurrency(valor: number) {
  return valor
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function ultimosMeses(quantidade: number) {
  const hoje = new Date();
  return Array.from({ length: quantidade }, (_, i) => {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1);
    const label = data.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return {
      value: `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    };
  });
}

const MESES = ultimosMeses(24);

export default function ProdutividadeTab() {
  const [mes, setMes] = useState(MESES[0].value);
  const [dados, setDados] = useState<Produtividade | null>(null);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    getProdutividade(mes)
      .then((data) => {
        if (ativo) setDados(data);
      })
      .catch((e) => {
        if (ativo)
          setErro(
            mensagemDeErro(e, "Não foi possível carregar a produtividade."),
          );
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    return () => {
      ativo = false;
    };
  }, [mes]);

  function trocarMes(novoMes: string) {
    if (novoMes === mes) return;
    setLoading(true);
    setErro(null);
    setMes(novoMes);
  }

  const resumo = dados?.resumo;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="OS FINALIZADAS"
          value={resumo?.ordens ?? 0}
          icon={ClipboardList}
          accentColor="#2563EB"
        />
        <StatCard
          label="FATURAMENTO"
          value={formatCurrency(resumo?.faturamento ?? 0)}
          icon={DollarSign}
          accentColor="#10B981"
        />
        <StatCard
          label="MÃO DE OBRA"
          value={formatCurrency(resumo?.mao_de_obra ?? 0)}
          icon={Wrench}
          accentColor="#A855F7"
        />
        <StatCard
          label="TICKET MÉDIO"
          value={formatCurrency(resumo?.ticket_medio ?? 0)}
          icon={Receipt}
          accentColor="#FF7518"
        />
      </div>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
              <TrendingUp size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">Produtividade</p>
              <p className="text-xs text-gray-500">
                OS finalizadas no mês, pela data de finalização, por mecânico
                responsável
              </p>
            </div>
          </div>

          <select
            value={mes}
            onChange={(e) => trocarMes(e.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF7518]"
          >
            {MESES.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        {erro && (
          <div className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
            {erro}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando produtividade...
          </div>
        ) : !dados || dados.membros.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            Nenhuma pessoa encontrada.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Nome</th>
                  <th className="px-5 py-3 font-medium">Perfil</th>
                  <th className="px-5 py-3 text-right font-medium">
                    OS finalizadas
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Faturamento
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Mão de obra
                  </th>
                  <th className="px-5 py-3 text-right font-medium">
                    Ticket médio
                  </th>
                </tr>
              </thead>
              <tbody>
                {dados.membros.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-gray-50 last:border-0"
                  >
                    <td className="px-5 py-4">
                      <div
                        className={`flex items-center gap-3 ${m.ativo ? "" : "opacity-60"}`}
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#FF75181A] text-sm font-semibold text-[#FF7518]">
                          {m.nome.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-[#1F1F1F]">
                            {m.nome}
                            {!m.ativo && (
                              <span className="ml-2 text-xs font-normal text-gray-400">
                                (desativado)
                              </span>
                            )}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {m.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">
                        {PERFIL_LABEL[m.perfil]}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-[#1F1F1F]">
                      {m.ordens}
                    </td>
                    <td className="px-5 py-4 text-right font-medium text-[#1F1F1F]">
                      {formatCurrency(m.faturamento)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {formatCurrency(m.mao_de_obra)}
                    </td>
                    <td className="px-5 py-4 text-right text-gray-600">
                      {m.ordens > 0 ? formatCurrency(m.ticket_medio) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
