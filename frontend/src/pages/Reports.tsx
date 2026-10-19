import { useState, useEffect, useCallback } from "react";
import {
  BarChart3,
  Boxes,
  Wallet,
  Users,
  Download,
  FileDown,
  Loader2,
  DollarSign,
  ClipboardList,
  Receipt,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Package,
  UserPlus,
  PackageMinus,
} from "lucide-react";
import StatCard from "../components/ui/StatCard";
import { downloadCsv } from "../lib/csv";
import {
  FORMATO_CSV,
  formatDate,
  formatPercent,
  linhasCsv,
  tabelaCaixa,
  tabelaClientes,
  tabelaFaturamento,
  tabelaIndicadoresAtividade,
  tabelaIndicadoresConsumo,
  tabelaIndicadoresVendas,
  tabelaMargemPecas,
  tabelaPecasConsumidas,
  tabelaPosicaoEstoque,
  tabelaVendasPorDia,
} from "../lib/relatorios";
import {
  getVendasPorPeriodo,
  getStatusInventario,
  getResumoFinanceiro,
  getAtividadeClientes,
  type VendasPorPeriodo,
  type StatusInventario,
  type ResumoFinanceiro,
  type AtividadeClientes,
} from "../services/reports";

const TIPOS = [
  {
    id: "vendas",
    titulo: "Vendas por período",
    desc: "Faturamento das OS finalizadas",
    icon: BarChart3,
  },
  {
    id: "inventario",
    titulo: "Status do inventário",
    desc: "Estoque e consumo de peças",
    icon: Boxes,
  },
  {
    id: "resumo",
    titulo: "Resumo financeiro",
    desc: "Caixa e faturamento",
    icon: Wallet,
  },
  {
    id: "atividade",
    titulo: "Atividade do cliente",
    desc: "OS finalizadas por cliente",
    icon: Users,
  },
] as const;

type TipoRelatorio = (typeof TIPOS)[number]["id"];

const inputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3 py-2.5 text-sm text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA]";

function formatCurrency(valor: number) {
  return valor
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function toIso(data: Date) {
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${data.getFullYear()}-${mes}-${dia}`;
}

const ATALHOS: { label: string; intervalo: () => [string, string] }[] = [
  {
    label: "Essa semana",
    intervalo: () => {
      const hoje = new Date();
      const diff = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1;
      const inicio = new Date(hoje);
      inicio.setDate(hoje.getDate() - diff);
      return [toIso(inicio), toIso(hoje)];
    },
  },
  {
    label: "Esse mês",
    intervalo: () => {
      const hoje = new Date();
      return [
        toIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
        toIso(hoje),
      ];
    },
  },
  {
    label: "Últimos 3 meses",
    intervalo: () => {
      const hoje = new Date();
      const inicio = new Date(hoje);
      inicio.setMonth(hoje.getMonth() - 3);
      return [toIso(inicio), toIso(hoje)];
    },
  },
  {
    label: "Este ano",
    intervalo: () => {
      const hoje = new Date();
      return [toIso(new Date(hoje.getFullYear(), 0, 1)), toIso(hoje)];
    },
  },
];

function trendDe(variacao: number | null, menorEhMelhor = false) {
  if (variacao === null) return undefined;
  return {
    value: `${variacao >= 0 ? "↑" : "↓"} ${Math.abs(variacao).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}% vs período anterior`,
    positive: menorEhMelhor ? variacao <= 0 : variacao >= 0,
  };
}

function Variacao({ valor }: { valor: number | null }) {
  if (valor === null) return <span className="text-gray-400">—</span>;
  return (
    <span
      className={`font-medium ${valor >= 0 ? "text-emerald-600" : "text-red-500"}`}
    >
      {valor >= 0 ? "↑" : "↓"} {formatPercent(Math.abs(valor))}
    </span>
  );
}

function ComparadoCom({
  periodo,
  children,
}: {
  periodo: { inicio: string; fim: string };
  children?: React.ReactNode;
}) {
  return (
    <p className="border-b border-gray-100 bg-gray-50/50 px-5 pb-4 text-xs text-gray-500">
      Comparado com {formatDate(periodo.inicio)} a {formatDate(periodo.fim)}{" "}
      {children}
    </p>
  );
}

function periodoCsv(p: { inicio: string; fim: string }) {
  return `${formatDate(p.inicio)} a ${formatDate(p.fim)}`;
}

function Tabela({
  colunas,
  linhas,
  vazio,
}: {
  colunas: { titulo: string; direita?: boolean }[];
  linhas: React.ReactNode[][];
  vazio: string;
}) {
  if (linhas.length === 0) {
    return (
      <div className="p-10 text-center text-sm text-gray-500">{vazio}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
            {colunas.map((c) => (
              <th
                key={c.titulo}
                className={`px-5 py-3 font-medium ${c.direita ? "text-right" : ""}`}
              >
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, i) => (
            <tr
              key={i}
              className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
            >
              {linha.map((celula, j) => (
                <td
                  key={j}
                  className={`px-5 py-3 text-[#1F1F1F] ${colunas[j].direita ? "text-right" : ""}`}
                >
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function Reports() {
  const hoje = new Date();
  const [tipo, setTipo] = useState<TipoRelatorio>("vendas");
  const [inicio, setInicio] = useState(
    toIso(new Date(hoje.getFullYear(), hoje.getMonth(), 1)),
  );
  const [fim, setFim] = useState(toIso(hoje));
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const [vendas, setVendas] = useState<VendasPorPeriodo | null>(null);
  const [inventario, setInventario] = useState<StatusInventario | null>(null);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);
  const [atividade, setAtividade] = useState<AtividadeClientes | null>(null);
  const [apenasAbaixoMinimo, setApenasAbaixoMinimo] = useState(false);
  const [gerandoPdf, setGerandoPdf] = useState(false);
  const [erroPdf, setErroPdf] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (inicio > fim) {
      setErro("A data inicial não pode ser maior que a final.");
      return;
    }
    setLoading(true);
    setErro(null);
    try {
      if (tipo === "vendas") setVendas(await getVendasPorPeriodo(inicio, fim));
      if (tipo === "inventario")
        setInventario(await getStatusInventario(inicio, fim));
      if (tipo === "resumo") setResumo(await getResumoFinanceiro(inicio, fim));
      if (tipo === "atividade")
        setAtividade(await getAtividadeClientes(inicio, fim));
    } catch (err: any) {
      setErro(
        err?.response?.data?.erro ||
          err?.response?.data?.error ||
          "Não foi possível gerar o relatório.",
      );
    } finally {
      setLoading(false);
    }
  }, [tipo, inicio, fim]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function aplicarAtalho(intervalo: () => [string, string]) {
    const [novoInicio, novoFim] = intervalo();
    setInicio(novoInicio);
    setFim(novoFim);
  }

  function exportarCsv() {
    const periodo = `${formatDate(inicio)} a ${formatDate(fim)}`;

    if (tipo === "vendas" && vendas) {
      downloadCsv(`vendas-${inicio}-a-${fim}.csv`, [
        ["Relatório", "Vendas por período"],
        ["Período", periodo],
        [
          "Período anterior",
          `${formatDate(vendas.periodo_anterior.inicio)} a ${formatDate(vendas.periodo_anterior.fim)}`,
        ],
        [],
        ...linhasCsv(tabelaIndicadoresVendas(vendas, FORMATO_CSV)),
        [],
        ...linhasCsv(tabelaVendasPorDia(vendas, FORMATO_CSV)),
      ]);
    }

    if (tipo === "inventario" && inventario) {
      downloadCsv(`inventario-${inicio}-a-${fim}.csv`, [
        ["Relatório", "Status do inventário"],
        ["Período", periodo],
        ["Período anterior", periodoCsv(inventario.consumo.periodo_anterior)],
        [],
        ...linhasCsv(tabelaIndicadoresConsumo(inventario, FORMATO_CSV)),
        [],
        ...linhasCsv(tabelaPecasConsumidas(inventario, FORMATO_CSV)),
        [],
        ...linhasCsv(tabelaPosicaoEstoque(inventario, FORMATO_CSV)),
      ]);
    }

    if (tipo === "resumo" && resumo) {
      downloadCsv(`resumo-financeiro-${inicio}-a-${fim}.csv`, [
        ["Relatório", "Resumo financeiro"],
        ["Período", periodo],
        ["Período anterior", periodoCsv(resumo.periodo_anterior)],
        [],
        ...linhasCsv(tabelaCaixa(resumo, FORMATO_CSV)),
        [],
        ...linhasCsv(tabelaFaturamento(resumo, FORMATO_CSV)),
        [],
        ...linhasCsv(tabelaMargemPecas(resumo, FORMATO_CSV)),
      ]);
    }

    if (tipo === "atividade" && atividade) {
      downloadCsv(`atividade-clientes-${inicio}-a-${fim}.csv`, [
        ["Relatório", "Atividade do cliente"],
        ["Período", periodo],
        ["Período anterior", periodoCsv(atividade.periodo_anterior)],
        [],
        ...linhasCsv(tabelaIndicadoresAtividade(atividade, FORMATO_CSV)),
        [],
        ...linhasCsv(tabelaClientes(atividade, FORMATO_CSV)),
      ]);
    }
  }

  async function exportarPdf() {
    setGerandoPdf(true);
    setErroPdf(null);
    try {
      // O jspdf é pesado: só é carregado quando alguém pede o PDF
      const pdf = await import("../lib/pdfRelatorios");
      if (tipo === "vendas" && vendas) pdf.baixarPdfVendas(vendas, inicio, fim);
      if (tipo === "inventario" && inventario)
        pdf.baixarPdfInventario(inventario, inicio, fim);
      if (tipo === "resumo" && resumo)
        pdf.baixarPdfResumoFinanceiro(resumo, inicio, fim);
      if (tipo === "atividade" && atividade)
        pdf.baixarPdfAtividadeClientes(atividade, inicio, fim);
    } catch (err) {
      console.error(err);
      setErroPdf("Não foi possível gerar o PDF.");
    } finally {
      setGerandoPdf(false);
    }
  }

  const tipoAtual = TIPOS.find((t) => t.id === tipo)!;
  const podeExportar =
    !loading &&
    !erro &&
    ((tipo === "vendas" && vendas) ||
      (tipo === "inventario" && inventario) ||
      (tipo === "resumo" && resumo) ||
      (tipo === "atividade" && atividade));

  const itensInventario = inventario
    ? inventario.itens.filter((i) => !apenasAbaixoMinimo || i.abaixo_minimo)
    : [];

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-2xl font-semibold text-[#1F1F1F]">Relatórios</h1>
        <p className="text-sm text-gray-500">
          Consulte o desempenho da oficina e exporte os dados em CSV ou PDF.
        </p>
      </div>

      {/* Configuração */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 p-5 sm:grid-cols-2 lg:grid-cols-4">
          {TIPOS.map((t) => {
            const Icon = t.icon;
            const ativo = t.id === tipo;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={`flex items-start gap-3 rounded-xl border-[1.5px] p-3.5 text-left transition ${
                  ativo
                    ? "border-[#FF7518] bg-[#FF75180D]"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                    ativo
                      ? "bg-[#FF75181A] text-[#FF7518]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  <Icon size={17} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[#1F1F1F]">
                    {t.titulo}
                  </p>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-t border-gray-100 bg-gray-50/50 p-5 lg:flex-row lg:items-end">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Data início
            </label>
            <input
              type="date"
              value={inicio}
              max={fim}
              onChange={(e) => setInicio(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Data fim
            </label>
            <input
              type="date"
              value={fim}
              min={inicio}
              onChange={(e) => setFim(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {ATALHOS.map((a) => (
              <button
                key={a.label}
                type="button"
                onClick={() => aplicarAtalho(a.intervalo)}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
              >
                {a.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Resultado */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 p-5">
          <div>
            <p className="font-semibold text-[#1F1F1F]">{tipoAtual.titulo}</p>
            <p className="text-xs text-gray-500">
              {formatDate(inicio)} a {formatDate(fim)}
            </p>
            {erroPdf && <p className="text-xs text-red-500">{erroPdf}</p>}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={exportarPdf}
              disabled={!podeExportar || gerandoPdf}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-50"
            >
              {gerandoPdf ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <FileDown size={15} />
              )}
              Exportar PDF
            </button>
            <button
              type="button"
              onClick={exportarCsv}
              disabled={!podeExportar}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f] disabled:opacity-50"
            >
              <Download size={15} />
              Exportar CSV
            </button>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Gerando relatório...
          </div>
        )}

        {!loading && erro && (
          <div className="p-10 text-center text-sm text-red-500">{erro}</div>
        )}

        {/* VENDAS */}
        {!loading && !erro && tipo === "vendas" && vendas && (
          <>
            <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-5 sm:grid-cols-3">
              <StatCard
                label="FATURAMENTO"
                value={formatCurrency(vendas.atual.total)}
                icon={DollarSign}
                accentColor="#10B981"
                trend={trendDe(vendas.variacao.total)}
              />
              <StatCard
                label="OS FINALIZADAS"
                value={vendas.atual.ordens}
                icon={ClipboardList}
                accentColor="#2563EB"
                trend={trendDe(vendas.variacao.ordens)}
              />
              <StatCard
                label="TICKET MÉDIO"
                value={formatCurrency(vendas.atual.ticket_medio)}
                icon={Receipt}
                accentColor="#FF7518"
                trend={trendDe(vendas.variacao.ticket_medio)}
              />
            </div>
            <p className="border-b border-gray-100 bg-gray-50/50 px-5 pb-4 text-xs text-gray-500">
              Comparado com {formatDate(vendas.periodo_anterior.inicio)} a{" "}
              {formatDate(vendas.periodo_anterior.fim)} (
              {formatCurrency(vendas.anterior.total)}, {vendas.anterior.ordens}{" "}
              OS).
              {vendas.anterior.ordens === 0 &&
                " Não houve vendas nesse período, então não há variação para mostrar."}{" "}
              Faturamento é o valor das OS finalizadas, pela data de
              finalização. Os pagamentos recebidos estão no Resumo financeiro.
            </p>
            <Tabela
              colunas={[
                { titulo: "Data" },
                { titulo: "OS finalizadas", direita: true },
                { titulo: "Faturamento", direita: true },
              ]}
              linhas={vendas.por_dia.map((d) => [
                formatDate(d.data),
                d.ordens,
                <span className="font-medium">{formatCurrency(d.total)}</span>,
              ])}
              vazio="Nenhuma OS finalizada neste período."
            />
          </>
        )}

        {/* INVENTÁRIO */}
        {!loading && !erro && tipo === "inventario" && inventario && (
          <>
            <div className="bg-gray-50/50 px-5 pt-5">
              <p className="text-sm font-semibold text-[#1F1F1F]">
                Consumo de peças
              </p>
              <p className="text-xs text-gray-500">
                Peças das OS finalizadas no período, pela data de finalização, a
                preço de venda.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-5 sm:grid-cols-2">
              <StatCard
                label="PEÇAS CONSUMIDAS"
                value={inventario.consumo.atual.quantidade}
                icon={PackageMinus}
                accentColor="#2563EB"
                trend={trendDe(inventario.consumo.variacao.quantidade)}
              />
              <StatCard
                label="VALOR DE VENDA"
                value={formatCurrency(inventario.consumo.atual.valor)}
                icon={DollarSign}
                accentColor="#10B981"
                trend={trendDe(inventario.consumo.variacao.valor)}
              />
            </div>
            <ComparadoCom periodo={inventario.consumo.periodo_anterior}>
              ({inventario.consumo.anterior.quantidade} peças,{" "}
              {formatCurrency(inventario.consumo.anterior.valor)}).
            </ComparadoCom>
            <Tabela
              colunas={[
                { titulo: "Peça consumida" },
                { titulo: "Categoria" },
                { titulo: "Quantidade", direita: true },
                { titulo: "Valor de venda", direita: true },
              ]}
              linhas={inventario.consumo.itens.map((i) => [
                <span className="font-medium">{i.nome}</span>,
                i.categoria ?? "—",
                i.quantidade,
                formatCurrency(i.valor),
              ])}
              vazio="Nenhuma peça consumida em OS finalizadas neste período."
            />
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 pt-5">
              <p className="text-sm font-semibold text-[#1F1F1F]">
                Posição atual do estoque
              </p>
              <p className="text-xs text-gray-500">
                Quantidades de hoje, independentes do período.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-5 sm:grid-cols-3">
              <StatCard
                label="TOTAL DE ITENS"
                value={inventario.resumo.total_itens}
                icon={Package}
                accentColor="#FF7518"
              />
              <StatCard
                label="ABAIXO DO MÍNIMO"
                value={inventario.resumo.abaixo_minimo}
                icon={AlertTriangle}
                accentColor="#F59E0B"
              />
              <StatCard
                label="VALOR EM ESTOQUE"
                value={formatCurrency(inventario.resumo.valor_total)}
                icon={DollarSign}
                accentColor="#10B981"
              />
            </div>
            <label className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/50 px-5 pb-4 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={apenasAbaixoMinimo}
                onChange={(e) => setApenasAbaixoMinimo(e.target.checked)}
              />
              Mostrar só itens abaixo do mínimo
            </label>
            <Tabela
              colunas={[
                { titulo: "Item" },
                { titulo: "Categoria" },
                { titulo: "Quantidade", direita: true },
                { titulo: "Mínimo", direita: true },
                { titulo: "Preço de venda", direita: true },
                { titulo: "Em estoque", direita: true },
                { titulo: "Situação" },
              ]}
              linhas={itensInventario.map((i) => [
                <span className="font-medium">{i.nome}</span>,
                i.categoria ?? "—",
                i.quantidade,
                i.quantidade_minima,
                formatCurrency(i.valor_final),
                formatCurrency(i.valor_em_estoque),
                <span
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    i.abaixo_minimo
                      ? "bg-amber-100 text-amber-700"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {i.abaixo_minimo ? "Estoque baixo" : "Em estoque"}
                </span>,
              ])}
              vazio="Nenhum item para mostrar."
            />
          </>
        )}

        {/* RESUMO FINANCEIRO */}
        {!loading && !erro && tipo === "resumo" && resumo && (
          <>
            <div className="bg-gray-50/50 px-5 pt-5">
              <p className="text-sm font-semibold text-[#1F1F1F]">Caixa</p>
              <p className="text-xs text-gray-500">
                Entradas e saídas lançadas no financeiro, pela data do
                lançamento.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-5 sm:grid-cols-3">
              <StatCard
                label="ENTRADAS"
                value={formatCurrency(resumo.entradas)}
                icon={TrendingUp}
                accentColor="#10B981"
                trend={trendDe(resumo.variacao.entradas)}
              />
              <StatCard
                label="SAÍDAS"
                value={formatCurrency(resumo.saidas)}
                icon={TrendingDown}
                accentColor="#EF4444"
                trend={trendDe(resumo.variacao.saidas, true)}
              />
              <StatCard
                label="SALDO"
                value={formatCurrency(resumo.saldo)}
                icon={Wallet}
                accentColor="#2563EB"
                trend={trendDe(resumo.variacao.saldo)}
              />
            </div>
            <ComparadoCom periodo={resumo.periodo_anterior}>
              (entradas {formatCurrency(resumo.anterior.entradas)}, saídas{" "}
              {formatCurrency(resumo.anterior.saidas)}, saldo{" "}
              {formatCurrency(resumo.anterior.saldo)}). Outras receitas
              (lançamentos sem OS): {formatCurrency(resumo.outras_receitas)}.
            </ComparadoCom>
            <div className="border-b border-gray-100 px-5 py-3">
              <p className="text-sm font-semibold text-[#1F1F1F]">
                Faturamento
              </p>
              <p className="text-xs text-gray-500">
                Composição das OS finalizadas no período, pela data de
                finalização.
              </p>
            </div>
            <Tabela
              colunas={[
                { titulo: "Origem" },
                { titulo: "Valor", direita: true },
                { titulo: "% do faturamento", direita: true },
                { titulo: "Período anterior", direita: true },
                { titulo: "Variação", direita: true },
              ]}
              linhas={[
                [
                  "Mão de obra",
                  formatCurrency(
                    resumo.composicao_receita_os.mao_de_obra.valor,
                  ),
                  formatPercent(
                    resumo.composicao_receita_os.mao_de_obra.percentual,
                  ),
                  formatCurrency(resumo.anterior.mao_de_obra),
                  <Variacao valor={resumo.variacao.mao_de_obra} />,
                ],
                [
                  "Peças",
                  formatCurrency(resumo.composicao_receita_os.pecas.valor),
                  formatPercent(resumo.composicao_receita_os.pecas.percentual),
                  formatCurrency(resumo.anterior.pecas),
                  <Variacao valor={resumo.variacao.pecas} />,
                ],
                [
                  <span className="font-semibold">Total faturado</span>,
                  <span className="font-semibold">
                    {formatCurrency(resumo.composicao_receita_os.total)}
                  </span>,
                  "",
                  <span className="font-semibold">
                    {formatCurrency(resumo.anterior.faturamento)}
                  </span>,
                  <Variacao valor={resumo.variacao.faturamento} />,
                ],
              ]}
              vazio=""
            />
            <div className="border-y border-gray-100 px-5 py-3">
              <p className="text-sm font-semibold text-[#1F1F1F]">
                Margem das peças
              </p>
              <p className="text-xs text-gray-500">
                Venda menos custo das peças nas mesmas OS do faturamento,
                recebidas ou não. O custo é o do estoque no momento em que a
                peça entrou na OS.
              </p>
            </div>
            <Tabela
              colunas={[
                { titulo: "Indicador" },
                { titulo: "Atual", direita: true },
                { titulo: "Período anterior", direita: true },
                { titulo: "Variação", direita: true },
              ]}
              linhas={[
                [
                  "Custo das peças",
                  formatCurrency(resumo.margem_pecas.custo),
                  formatCurrency(resumo.anterior.custo_pecas),
                  <Variacao valor={resumo.variacao.custo_pecas} />,
                ],
                [
                  "Margem (R$)",
                  formatCurrency(resumo.margem_pecas.margem),
                  formatCurrency(resumo.anterior.margem_pecas),
                  <Variacao valor={resumo.variacao.margem_pecas} />,
                ],
                [
                  "Margem (%)",
                  resumo.margem_pecas.percentual === null
                    ? "—"
                    : formatPercent(resumo.margem_pecas.percentual),
                  "",
                  "",
                ],
                [
                  "Peças sem custo registrado (venda, fora da margem)",
                  formatCurrency(resumo.margem_pecas.valor_sem_custo),
                  "",
                  "",
                ],
              ]}
              vazio=""
            />
            <p className="border-t border-gray-100 px-5 py-4 text-xs text-gray-500">
              Só as peças com custo registrado entram na margem. Peças
              adicionadas antes do registro de custo aparecem como sem custo
              registrado.
            </p>
          </>
        )}

        {/* ATIVIDADE DO CLIENTE */}
        {!loading && !erro && tipo === "atividade" && atividade && (
          <>
            <div className="grid grid-cols-1 gap-4 bg-gray-50/50 p-5 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="CLIENTES ATENDIDOS"
                value={atividade.resumo.clientes_atendidos}
                icon={Users}
                accentColor="#A855F7"
                trend={trendDe(atividade.variacao.clientes_atendidos)}
              />
              <StatCard
                label="CLIENTES NOVOS"
                value={atividade.resumo.clientes_novos}
                icon={UserPlus}
                accentColor="#FF7518"
                trend={trendDe(atividade.variacao.clientes_novos)}
              />
              <StatCard
                label="OS FINALIZADAS"
                value={atividade.resumo.ordens}
                icon={ClipboardList}
                accentColor="#2563EB"
                trend={trendDe(atividade.variacao.ordens)}
              />
              <StatCard
                label="TOTAL FATURADO"
                value={formatCurrency(atividade.resumo.total)}
                icon={DollarSign}
                accentColor="#10B981"
                trend={trendDe(atividade.variacao.total)}
              />
            </div>
            <ComparadoCom periodo={atividade.periodo_anterior}>
              (clientes atendidos: {atividade.anterior.clientes_atendidos},
              novos: {atividade.anterior.clientes_novos}, OS:{" "}
              {atividade.anterior.ordens}, total:{" "}
              {formatCurrency(atividade.anterior.total)}). Considera as OS
              finalizadas no período, pela data de finalização; clientes novos
              são os cadastrados no período.
            </ComparadoCom>
            <Tabela
              colunas={[
                { titulo: "Cliente" },
                { titulo: "OS finalizadas", direita: true },
                { titulo: "Total faturado", direita: true },
                { titulo: "Ticket médio", direita: true },
                { titulo: "Última finalização", direita: true },
              ]}
              linhas={atividade.clientes.map((c) => [
                <span className="font-medium">{c.nome}</span>,
                c.ordens,
                formatCurrency(c.total),
                formatCurrency(c.ticket_medio),
                formatDate(c.ultima_os),
              ])}
              vazio="Nenhum cliente com OS finalizada neste período."
            />
          </>
        )}
      </div>
    </div>
  );
}
