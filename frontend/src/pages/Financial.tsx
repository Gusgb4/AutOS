import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  ExternalLink,
  Hourglass,
  ListChecks,
  Loader2,
  Plus,
  Receipt,
  Wallet,
  Eye,
  EyeOff
} from "lucide-react";
import { isAxiosError } from "axios";
import StatCard from "../components/ui/StatCard";
import PaymentStatusBadge from "../components/ui/PaymentStatusBadge";
import FinancialEntryModal from "../components/financial/FinancialEntryModal";
import {
  createFinancialEntry,
  listarAReceber,
  listFinancialEntries,
  type ContaAReceber,
  type FinancialEntry,
  type FinancialEntryPayload,
  type TipoLancamento,
} from "../services/financial";
import { formaPagamentoLabel } from "../services/serviceOrders";

interface Filtros {
  tipo: TipoLancamento | "";
  inicio: string;
  fim: string;
}

const filtrosVazios: Filtros = { tipo: "", inicio: "", fim: "" };

const moeda = (valor: number) =>
  valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function Financial() {
  const navigate = useNavigate();
  const [showValues, setShowValues] = useState(true);

  const [aReceber, setAReceber] = useState<{
    total: string;
    ordens: ContaAReceber[];
  } | null>(null);
  const [erroAReceber, setErroAReceber] = useState<string | null>(null);
  const [aReceberAberto, setAReceberAberto] = useState(false);
  
  const [lancamentos, setLancamentos] = useState<FinancialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [filtros, setFiltros] = useState(filtrosVazios);

  const [modalAberto, setModalAberto] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erroModal, setErroModal] = useState<string | null>(null);

  async function carregar(alvo: Filtros) {
    try {
      setLoading(true);
      setErro(null);
      const data = await listFinancialEntries({
        tipo: alvo.tipo || undefined,
        inicio: alvo.inicio || undefined,
        fim: alvo.fim ? `${alvo.fim}T23:59:59` : undefined,
      });
      setLancamentos(data);
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

    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    let ativo = true;

    listarAReceber()
      .then((data) => {
        if (ativo) setAReceber(data);
      })
      .catch((e) => {
        if (ativo) {
          setErroAReceber(
            (isAxiosError(e) ? e.response?.data?.erro : undefined) ??
              "Não foi possível carregar as contas a receber.",
          );
        }
      });

    return () => {
      ativo = false;
    };
  }, []);

  function aplicarFiltro(patch: Partial<Filtros>) {
    const novos = { ...filtros, ...patch };
    setFiltros(novos);
    carregar(novos);
  }

  const totalReceitas = lancamentos
    .filter((l) => l.tipo === "RECEITA")
    .reduce((soma, l) => soma + Number(l.valor), 0);
  const totalDespesas = lancamentos
    .filter((l) => l.tipo === "DESPESA")
    .reduce((soma, l) => soma + Number(l.valor), 0);
  const saldo = totalReceitas - totalDespesas;

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

  function limparFiltros() {
    setFiltros(filtrosVazios);
    carregar(filtrosVazios);
  }

  const temFiltro = Boolean(filtros.tipo || filtros.inicio || filtros.fim);
  const ocultavel = (valor: number) => (showValues ? moeda(valor) : "R$ •••••");

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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <StatCard
          label="RECEITAS"
          value={showValues ? moeda(totalReceitas) : "R$ •••••"}
          icon={ArrowUpCircle}
          accentColor="#10B981"
          valueColor
        />
        <StatCard
          label="DESPESAS"
          value={showValues ? moeda(totalDespesas) : "R$ •••••"}
          icon={ArrowDownCircle}
          accentColor="#EF4444"
          valueColor
        />
        <StatCard
          label="SALDO"
          value={showValues ? moeda(saldo) : "R$ •••••"}
          icon={Wallet}
          accentColor={saldo >= 0 ? "#10B981" : "#EF4444"}
          valueColor
        />
        <StatCard
          label="A RECEBER"
          value={aReceber ? ocultavel(Number(aReceber.total)) : "—"}
          icon={Hourglass}
          accentColor="#F59E0B"
          valueColor
          onClick={() => setAReceberAberto((aberto) => !aberto)}
          active={aReceberAberto}
        />
        <StatCard
          label="LANÇAMENTOS"
          value={lancamentos.length}
          icon={ListChecks}
          accentColor="#FF7518"
        />
      </div>

      {aReceberAberto && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="flex items-center gap-3 border-b border-gray-100 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Hourglass size={18} />
            </div>
            <div>
              <p className="font-semibold text-[#1F1F1F]">A receber</p>
              <p className="text-xs text-gray-500">
                Ordens finalizadas com pagamento pendente ou parcial
              </p>
            </div>
          </div>

          {erroAReceber ? (
            <div className="p-10 text-center text-sm text-red-500">
              {erroAReceber}
            </div>
          ) : !aReceber ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-gray-500">
              <Loader2 size={16} className="animate-spin" />
              Carregando contas a receber...
            </div>
          ) : aReceber.ordens.length === 0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              Nenhuma OS com valor a receber.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs uppercase tracking-wide text-gray-400">
                    <th className="px-5 py-3 font-medium">Ordem</th>
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Veículo</th>
                    <th className="px-5 py-3 font-medium">Pagamento</th>
                    <th className="px-5 py-3 text-right font-medium">Total</th>
                    <th className="px-5 py-3 text-right font-medium">Pago</th>
                    <th className="px-5 py-3 text-right font-medium">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {aReceber.ordens.map((ordem) => (
                    <tr
                      key={ordem.id}
                      onClick={() => navigate(`/ordens-servico/${ordem.id}`)}
                      className="cursor-pointer border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4 font-medium text-[#FF7518]">
                        #OS-{ordem.id}
                      </td>
                      <td className="px-5 py-4">
                        <p className="font-medium text-[#1F1F1F]">
                          {ordem.cliente.nome}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ordem.cliente.telefone}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-gray-700">
                          {ordem.veiculo.marca} {ordem.veiculo.modelo}
                        </p>
                        <p className="text-xs text-gray-400">
                          {ordem.veiculo.placa}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <PaymentStatusBadge status={ordem.status_pagamento} />
                      </td>
                      <td className="px-5 py-4 text-right text-gray-600">
                        {ocultavel(Number(ordem.valor_total))}
                      </td>
                      <td className="px-5 py-4 text-right text-emerald-600">
                        {ocultavel(Number(ordem.valor_pago))}
                      </td>
                      <td className="px-5 py-4 text-right font-semibold text-red-500">
                        {ocultavel(Number(ordem.saldo))}
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
                  <th className="px-5 py-3 font-medium">Forma de pagamento</th>
                  <th className="px-5 py-3 font-medium">Origem</th>
                  <th className="px-5 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody>
                {lancamentos.map((lancamento) => {
                  const receita = lancamento.tipo === "RECEITA";
                  return (
                    <tr
                      key={lancamento.id}
                      className="border-b border-gray-50 last:border-0 hover:bg-gray-50/60"
                    >
                      <td className="px-5 py-4 text-gray-600">
                        {new Date(lancamento.data).toLocaleDateString("pt-BR")}
                      </td>

                      <td className="px-5 py-4 font-medium text-[#1F1F1F]">
                        {lancamento.descricao}
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
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {lancamento.forma_pagamento ? (
                          formaPagamentoLabel(lancamento.forma_pagamento)
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-gray-600">
                        {lancamento.ordemId ? (
                          <Link
                            to={`/ordens-servico/${lancamento.ordemId}`}
                            className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600 hover:bg-orange-50 hover:text-[#FF7518]"
                          >
                            OS #{lancamento.ordemId}
                            <ExternalLink size={11} />
                          </Link>
                        ) : (
                          <span className="text-xs text-gray-400">Manual</span>
                        )}
                      </td>

                      <td
                        className={`px-5 py-4 text-right font-semibold ${
                          receita ? "text-emerald-600" : "text-red-500"
                        }`}
                      >
                        {receita ? "+" : "-"} {moeda(Number(lancamento.valor))}
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