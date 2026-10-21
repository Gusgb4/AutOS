import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ListChecks,
  Loader2,
  Plus,
  Receipt,
  Wallet,
  Eye,
  EyeOff,
  HandCoins,
  RotateCcw,
  PieChart,
  CreditCard,
} from "lucide-react";
import { mensagemDeErro } from "../lib/errors";
import { isAxiosError } from "axios";
import StatCard from "../components/ui/StatCard";
import PagamentoBadge from "../components/ui/PagamentoBadge";
import FinancialEntryModal from "../components/financial/FinancialEntryModal";
import DistribuicaoCard from "../components/financial/DistribuicaoCard";
import {
  FORMA_LABEL,
  rotuloForma,
  type FormaPagamento,
} from "../services/serviceOrders";
import {
  CATEGORIA_LABEL,
  createFinancialEntry,
  estornarFinancialEntry,
  getContasAReceber,
  getResumoFinanceiro,
  listFinancialEntries,
  type CategoriaDespesa,
  type ContasAReceber,
  type FinancialEntry,
  type FinancialEntryPayload,
  type ResumoFinanceiro,
  type TipoLancamento,
} from "../services/financial";

interface Filtros {
  tipo: TipoLancamento | "";
  categoria: CategoriaDespesa | "";
  forma: FormaPagamento | "";
  inicio: string;
  fim: string;
  estornados: boolean;
}

const filtrosVazios: Filtros = {
  tipo: "",
  categoria: "",
  forma: "",
  inicio: "",
  fim: "",
  estornados: false,
};

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const dataBR = (iso: string) => iso.split("-").reverse().join("/");

// Variação em %; nas despesas, subir é ruim (vermelho)
function tendencia(valor: number | null | undefined, subirEhBom = true) {
  if (valor === null || valor === undefined) return undefined;
  const sinal = valor > 0 ? "+" : "";
  return {
    value: `${sinal}${valor.toLocaleString("pt-BR")}% vs período anterior`,
    positive: subirEhBom ? valor >= 0 : valor <= 0,
  };
}

export default function Financial() {
  const navigate = useNavigate();
  const [showValues, setShowValues] = useState(true);
  const [aReceber, setAReceber] = useState<ContasAReceber | null>(null);
  const [resumo, setResumo] = useState<ResumoFinanceiro | null>(null);

  const [lancamentos, setLancamentos] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtros, setFiltros] = useState(filtrosVazios);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  // Estorno pede confirmação na própria linha, sem o confirm() do navegador
  const [confirmandoEstorno, setConfirmandoEstorno] = useState<string | null>(
    null,
  );
  const [estornando, setEstornando] = useState(false);
  const [erroEstorno, setErroEstorno] = useState<string | null>(null);

  async function carregar(alvo: Filtros) {
    try {
      setLoading(true);
      setErro(null);
      const data = await listFinancialEntries({
        tipo: alvo.tipo || undefined,
        categoria: alvo.categoria || undefined,
        forma: alvo.forma || undefined,
        inicio: alvo.inicio || undefined,
        fim: alvo.fim || undefined,
        estornados: alvo.estornados,
      });
      setLancamentos(data);

      const temPeriodo = Boolean(alvo.inicio && alvo.fim);
      setResumo(
        await getResumoFinanceiro(
          temPeriodo ? alvo.inicio : undefined,
          temPeriodo ? alvo.fim : undefined,
        ),
      );
    } catch (e) {
      setErro(
        (isAxiosError(e) ? e.response?.data?.erro : undefined) ??
          "Não foi possível carregar os lançamentos financeiros.",
      );
    } finally {
      setLoading(false);
    }
  }

  // Carga inicial (o estado já começa com loading = true)
  useEffect(() => {
    let ativo = true;

    listFinancialEntries({})
      .then((data) => {
        if (ativo) setLancamentos(data);
      })
      .catch((e) => {
        if (ativo) {
          setErro(
            (isAxiosError(e) ? e.response?.data?.erro : undefined) ??
              "Não foi possível carregar os lançamentos financeiros.",
          );
        }
      })
      .finally(() => {
        if (ativo) setLoading(false);
      });

    getResumoFinanceiro()
      .then((data) => {
        if (ativo) setResumo(data);
      })
      .catch(() => {
        if (ativo) setResumo(null);
      });

    getContasAReceber()
      .then((data) => {
        if (ativo) setAReceber(data);
      })
      .catch(() => {
        if (ativo) setAReceber(null);
      });

    return () => {
      ativo = false;
    };
  }, []);

  function aplicarFiltro(patch: Partial<Filtros>) {
    const novos = { ...filtros, ...patch };
    // Categoria é só de despesa e forma é só de receita: os dois juntos
    // nunca acham nada, então escolher um limpa o outro
    if (novos.tipo === "RECEITA" || patch.forma) novos.categoria = "";
    if (novos.tipo === "DESPESA" || patch.categoria) novos.forma = "";
    setFiltros(novos);
    carregar(novos);
  }

  // Os cards mostram o período (filtro ou mes atual), o mesmo da comparação
  const totalReceitas = resumo?.atual.entradas ?? 0;
  const totalDespesas = resumo?.atual.saidas ?? 0;
  const saldo = resumo?.atual.saldo ?? 0;

  async function handleSalvar(payload: FinancialEntryPayload) {
    try {
      setSalvando(true);
      setErroModal(null);
      await createFinancialEntry(payload);
      setModalAberto(false);
      await carregar(filtros);
    } catch (e) {
      setErroModal(
        (isAxiosError(e) ? e.response?.data?.erro : undefined) ??
          "Não foi possível salvar o lançamento.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function handleEstornar(id: string) {
    try {
      setEstornando(true);
      setErroEstorno(null);
      await estornarFinancialEntry(id);
      setConfirmandoEstorno(null);
      // Recarrega lista e cards: o estornado sai dos totais
      await carregar(filtros);
    } catch (e) {
      setErroEstorno(
        mensagemDeErro(e, "Não foi possível estornar o lançamento."),
      );
    } finally {
      setEstornando(false);
    }
  }

  function limparFiltros() {
    setFiltros(filtrosVazios);
    carregar(filtrosVazios);
  }

  const temFiltro = Boolean(
    filtros.tipo ||
    filtros.categoria ||
    filtros.forma ||
    filtros.inicio ||
    filtros.fim ||
    filtros.estornados,
  );

  return (
    <div className="space-y-6 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#1F1F1F]">Financeiro</h1>
          <p className="text-sm text-gray-500">
            Acompanhe as receitas e despesas da oficina.
          </p>
        </div>
        <button
          onClick={() => setShowValues(!showValues)}
          className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          {showValues ? <EyeOff size={18} /> : <Eye size={18} />}
          {showValues ? "Ocultar Valores" : "Mostrar Valores"}
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="RECEITAS"
          value={showValues ? moeda(totalReceitas) : "R$ •••••"}
          icon={ArrowUpCircle}
          accentColor="#10B981"
          valueColor
          trend={showValues ? tendencia(resumo?.variacao.entradas) : undefined}
        />
        <StatCard
          label="DESPESAS"
          value={showValues ? moeda(totalDespesas) : "R$ •••••"}
          icon={ArrowDownCircle}
          accentColor="#EF4444"
          valueColor
          trend={
            showValues ? tendencia(resumo?.variacao.saidas, false) : undefined
          }
        />
        <StatCard
          label="SALDO"
          value={showValues ? moeda(saldo) : "R$ •••••"}
          icon={Wallet}
          accentColor={saldo >= 0 ? "#10B981" : "#EF4444"}
          valueColor
          trend={showValues ? tendencia(resumo?.variacao.saldo) : undefined}
        />

        <StatCard
          label="LANÇAMENTOS"
          value={lancamentos.length}
          icon={ListChecks}
          accentColor="#FF7518"
        />
      </div>

      {resumo && (
        <p className="-mt-2 text-xs text-gray-500">
          Período: {dataBR(resumo.periodo.inicio)} a{" "}
          {dataBR(resumo.periodo.fim)} · comparado com{" "}
          {dataBR(resumo.periodo_anterior.inicio)} a{" "}
          {dataBR(resumo.periodo_anterior.fim)}
          {!(filtros.inicio && filtros.fim) && " (mês atual)"}
        </p>
      )}

      {resumo && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Ajuda a conferir com o extrato do banco e da maquininha */}
          <DistribuicaoCard
            titulo="Recebido por forma de pagamento"
            subtitulo="Receitas no período dos cards acima"
            icone={CreditCard}
            corIcone="bg-emerald-50 text-emerald-600"
            corBarra="bg-emerald-500"
            vazio="Nenhuma receita no período."
            itens={(resumo.recebido_por_forma ?? []).map((r) => ({
              chave: r.forma,
              rotulo: rotuloForma(r.forma),
              valor: r.valor,
              percentual: r.percentual,
            }))}
            ocultarValores={!showValues}
          />
          <DistribuicaoCard
            titulo="Despesas por categoria"
            subtitulo="No período dos cards acima"
            icone={PieChart}
            corIcone="bg-red-50 text-red-500"
            corBarra="bg-red-400"
            vazio="Nenhuma despesa no período."
            itens={(resumo.despesas_por_categoria ?? []).map((d) => ({
              chave: d.categoria,
              rotulo: CATEGORIA_LABEL[d.categoria],
              valor: d.valor,
              percentual: d.percentual,
            }))}
            ocultarValores={!showValues}
          />
        </div>
      )}

      {aReceber && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <HandCoins size={18} />
              </div>
              <div>
                <p className="font-semibold text-[#1F1F1F]">A receber</p>
                <p className="text-xs text-gray-500">
                  OS finalizadas com saldo em aberto
                </p>
              </div>
            </div>
            <p className="text-lg font-semibold text-amber-600">
              {showValues ? moeda(Number(aReceber.total)) : "R$ •••••"}
            </p>
          </div>

          {aReceber.ordens.length === 0 ? (
            <div className="p-6 text-center text-sm text-gray-500">
              Nenhuma OS com saldo em aberto.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-medium">Ordem</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Pagamento</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 text-right font-medium">Pago</th>
                    <th className="px-5 py-3 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {aReceber.ordens.map((o) => (
                    <tr
                      key={o.id}
                      onClick={() => navigate(`/ordens-servico/${o.id}`)}
                      className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4 font-medium text-[#FF7518]">
                        #OS-{o.id}
                      </td>
                      <td className="px-5 py-4 text-[#1F1F1F]">
                        {o.cliente.nome}
                      </td>
                      <td className="px-5 py-4">
                        <PagamentoBadge status={o.status_pagamento} />
                      </td>
                      <td className="px-5 py-4 text-right text-gray-600">
                        {showValues ? moeda(Number(o.valor_total)) : "•••••"}
                      </td>
                      <td className="px-5 py-4 text-right text-gray-600">
                        {showValues ? moeda(Number(o.valor_pago)) : "•••••"}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-amber-600">
                        {showValues ? moeda(Number(o.saldo)) : "•••••"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-100 p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF75181A] text-[#FF7518]">
              <Receipt size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">Lançamentos</p>
              <p className="text-xs text-gray-500">
                Receitas e despesas registradas
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={filtros.tipo}
              onChange={(e) =>
                aplicarFiltro({ tipo: e.target.value as TipoLancamento | "" })
              }
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF7518]"
            >
              <option value="">Todos os tipos</option>
              <option value="RECEITA">Receitas</option>
              <option value="DESPESA">Despesas</option>
            </select>

            {filtros.tipo !== "RECEITA" && (
              <select
                value={filtros.categoria}
                onChange={(e) =>
                  aplicarFiltro({
                    categoria: e.target.value as CategoriaDespesa | "",
                  })
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF7518]"
              >
                <option value="">Todas as categorias</option>
                {(Object.keys(CATEGORIA_LABEL) as CategoriaDespesa[]).map(
                  (c) => (
                    <option key={c} value={c}>
                      {CATEGORIA_LABEL[c]}
                    </option>
                  ),
                )}
              </select>
            )}

            {filtros.tipo !== "DESPESA" && (
              <select
                value={filtros.forma}
                onChange={(e) =>
                  aplicarFiltro({
                    forma: e.target.value as FormaPagamento | "",
                  })
                }
                className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF7518]"
              >
                <option value="">Todas as formas</option>
                {(Object.keys(FORMA_LABEL) as FormaPagamento[]).map((f) => (
                  <option key={f} value={f}>
                    {FORMA_LABEL[f]}
                  </option>
                ))}
              </select>
            )}

            <input
              type="date"
              value={filtros.inicio}
              onChange={(e) => aplicarFiltro({ inicio: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF7518]"
            />
            <input
              type="date"
              value={filtros.fim}
              onChange={(e) => aplicarFiltro({ fim: e.target.value })}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#FF7518]"
            />

            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={filtros.estornados}
                onChange={(e) =>
                  aplicarFiltro({ estornados: e.target.checked })
                }
                className="h-4 w-4 accent-[#FF7518]"
              />
              Mostrar estornados
            </label>

            {temFiltro && (
              <button
                type="button"
                onClick={limparFiltros}
                className="text-sm font-medium text-gray-500 hover:text-[#FF7518]"
              >
                Limpar
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setErroModal(null);
                setModalAberto(true);
              }}
              className="flex items-center gap-2 rounded-xl bg-[#FF7518] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#e6690f]"
            >
              <Plus size={16} />
              Novo Lançamento
            </button>
          </div>
        </div>

        {erroEstorno && (
          <p className="border-b border-red-100 bg-red-50 px-5 py-3 text-sm text-red-600">
            {erroEstorno}
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
            <Loader2 size={16} className="animate-spin" />
            Carregando lançamentos...
          </div>
        ) : erro ? (
          <div className="p-10 text-center text-sm text-red-500">{erro}</div>
        ) : lancamentos.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-500">
            {temFiltro
              ? "Nenhum lançamento encontrado para os filtros aplicados."
              : "Nenhum lançamento registrado ainda."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                  <th className="px-5 py-3 font-medium">Data</th>
                  <th className="px-5 py-3 font-medium">Descrição</th>
                  <th className="px-5 py-3 font-medium">Tipo</th>
                  <th className="px-5 py-3 font-medium">Origem</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                  <th className="px-5 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((lancamento) => {
                  const receita = lancamento.tipo === "RECEITA";
                  // Estornado continua na lista (com o filtro ligado), com fundo
                  // amarelo clarinho pra se destacar dos lançamentos ativos
                  const estornado = lancamento.estornado;
                  return (
                    <tr
                      key={lancamento.id}
                      className={`border-b border-gray-50 last:border-0 ${
                        estornado
                          ? "bg-amber-50 text-gray-500 hover:bg-amber-100/60"
                          : "hover:bg-gray-50/60"
                      }`}
                    >
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(lancamento.data).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                        <span className={estornado ? "line-through" : ""}>
                          {lancamento.descricao}
                        </span>
                        {estornado && (
                          <span className="ml-2 rounded-full bg-gray-200 px-2 py-0.5 text-[11px] font-semibold text-gray-600">
                            Estornado
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex w-max items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${
                            receita
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-600"
                          }`}
                        >
                          {receita ? (
                            <ArrowUpCircle size={12} />
                          ) : (
                            <ArrowDownCircle size={12} />
                          )}
                          {receita ? "Receita" : "Despesa"}
                        </span>
                        {lancamento.categoria && (
                          <p className="mt-1 text-xs text-gray-500">
                            {CATEGORIA_LABEL[lancamento.categoria]}
                          </p>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {lancamento.ordemId ? (
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                            OS #{lancamento.ordemId}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">Manual</span>
                        )}
                        {lancamento.forma_pagamento && (
                          <p className="mt-1 text-xs text-gray-500">
                            {FORMA_LABEL[lancamento.forma_pagamento]}
                          </p>
                        )}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          receita ? "text-emerald-600" : "text-red-500"
                        } ${estornado ? "line-through" : ""}`}
                      >
                        {receita ? "+" : "-"} {moeda(Number(lancamento.valor))}
                      </td>

                      <td className="px-5 py-4 text-right">
                        {/* Só lançamento manual e ativo; pagamento de OS se estorna na OS */}
                        {!lancamento.ordemId &&
                          !estornado &&
                          (confirmandoEstorno === lancamento.id ? (
                            <div className="flex items-center justify-end gap-2">
                              <span className="text-xs text-gray-500">
                                Estornar?
                              </span>
                              <button
                                type="button"
                                onClick={() => handleEstornar(lancamento.id)}
                                disabled={estornando}
                                className="rounded-lg bg-red-500 px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                              >
                                {estornando ? "..." : "Sim"}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmandoEstorno(null)}
                                disabled={estornando}
                                className="rounded-lg border border-gray-200 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setErroEstorno(null);
                                setConfirmandoEstorno(lancamento.id);
                              }}
                              title="Lançou errado? Estorne e lance de novo com os dados certos."
                              className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200"
                            >
                              <RotateCcw size={12} />
                              Estornar
                            </button>
                          ))}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="border-t border-gray-100 px-5 py-4 text-xs text-gray-400">
          Mostrando {lancamentos.length} lançamento
          {lancamentos.length === 1 ? "" : "s"}
        </div>
      </div>

      <FinancialEntryModal
        open={modalAberto}
        submitting={salvando}
        erro={erroModal}
        onClose={() => setModalAberto(false)}
        onSave={handleSalvar}
      />
    </div>
  );
}
