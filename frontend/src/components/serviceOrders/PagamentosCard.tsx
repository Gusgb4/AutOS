import { useState, useEffect } from "react";
import { Wallet, Plus, Loader2, Undo2 } from "lucide-react";
import { isAxiosError } from "axios";
import PagamentoBadge from "../ui/PagamentoBadge";
import {
  listPagamentos,
  registrarPagamento,
  estornarPagamento,
  type FormaPagamento,
  type Pagamento,
  type ServiceOrder,
} from "../../services/serviceOrders";

const plainInputClass =
  "w-full rounded-lg border-[1.5px] border-gray-200 bg-[#FBFBFC] px-3 py-2.5 text-sm text-[#1B2130] outline-none transition focus:border-[#FF7518] focus:bg-white focus:ring-2 focus:ring-[#FDE7DA]";

const FORMAS: { value: FormaPagamento; label: string }[] = [
  { value: "PIX", label: "Pix" },
  { value: "DINHEIRO", label: "Dinheiro" },
  { value: "CARTAO", label: "Cartão" },
  { value: "OUTRO", label: "Outro" },
];

function formatCurrency(value: string | number) {
  return Number(value)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function formatValorInput(value: string | number) {
  return Number(value).toFixed(2).replace(".", ",");
}

function hojeIso() {
  const hoje = new Date();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${hoje.getFullYear()}-${mes}-${dia}`;
}

function apiErrorMessage(err: unknown, fallback: string) {
  return (isAxiosError(err) ? err.response?.data?.erro : undefined) ?? fallback;
}

interface PagamentosCardProps {
  ordem: ServiceOrder;
  podeGerenciar: boolean;
  onAlterado: () => void;
}

export default function PagamentosCard({
  ordem,
  podeGerenciar,
  onAlterado,
}: PagamentosCardProps) {
  const [pagamentos, setPagamentos] = useState<Pagamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [valor, setValor] = useState(formatValorInput(ordem.saldo));
  const [forma, setForma] = useState<FormaPagamento>("PIX");
  const [data, setData] = useState(hojeIso());
  const [salvando, setSalvando] = useState(false);
  const [estornandoId, setEstornandoId] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    listPagamentos(ordem.id)
      .then((data) => {
        if (ativo) setPagamentos(data);
      })
      .catch(() => {
        if (ativo) setErro("Não foi possível carregar os pagamentos.");
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [ordem.id, ordem.valor_pago]);

  const saldo = Number(ordem.saldo);
  const podeRegistrar =
    podeGerenciar && ordem.status === "FINALIZADA" && saldo > 0;

  async function handleRegistrar() {
    const valorNumero = Number(valor.replace(/\./g, "").replace(",", "."));
    if (!valorNumero || valorNumero <= 0) {
      setErro("Informe um valor maior que zero.");
      return;
    }
    if (valorNumero > saldo) {
      setErro(
        `O valor não pode ser maior que o saldo de ${formatCurrency(saldo)}.`,
      );
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      await registrarPagamento(ordem.id, {
        valor: valorNumero,
        forma_pagamento: forma,
        data,
      });
      setValor(formatValorInput(saldo - valorNumero));
      onAlterado();
    } catch (err) {
      setErro(apiErrorMessage(err, "Erro ao registrar o pagamento."));
    } finally {
      setSalvando(false);
    }
  }

  async function handleEstornar(pagamento: Pagamento) {
    if (
      !confirm(
        `Estornar o pagamento de ${formatCurrency(pagamento.valor)}? O valor volta para o saldo da OS.`,
      )
    )
      return;
    setEstornandoId(pagamento.id);
    setErro(null);
    try {
      await estornarPagamento(ordem.id, pagamento.id);
      setValor(formatValorInput(saldo + Number(pagamento.valor)));
      onAlterado();
    } catch (err) {
      setErro(apiErrorMessage(err, "Erro ao estornar o pagamento."));
    } finally {
      setEstornandoId(null);
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Wallet size={18} />
          </div>
          <div>
            <p className="font-semibold text-[#1F1F1F]">Pagamentos</p>
            <p className="text-xs text-gray-500">
              Cada pagamento entra no caixa na data informada
            </p>
          </div>
        </div>
        {ordem.status_pagamento && (
          <PagamentoBadge status={ordem.status_pagamento} />
        )}
      </div>

      <div className="grid grid-cols-3 gap-4 border-b border-gray-100 p-5">
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">
            Total da OS
          </p>
          <p className="mt-1 text-sm font-semibold text-[#1F1F1F]">
            {formatCurrency(ordem.valor_total)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Pago</p>
          <p className="mt-1 text-sm font-semibold text-emerald-600">
            {formatCurrency(ordem.valor_pago)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-400">Saldo</p>
          <p
            className={`mt-1 text-sm font-semibold ${saldo > 0 ? "text-red-500" : "text-[#1F1F1F]"}`}
          >
            {formatCurrency(Math.max(saldo, 0))}
          </p>
        </div>
      </div>

      {podeRegistrar && (
        <div className="flex flex-col gap-3 bg-gray-50/50 p-5 sm:flex-row sm:items-end">
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Valor (R$)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              className={plainInputClass}
            />
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">
              Forma de pagamento
            </label>
            <select
              value={forma}
              onChange={(e) => setForma(e.target.value as FormaPagamento)}
              className={plainInputClass}
            >
              {FORMAS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-1 flex-col gap-1.5">
            <label className="text-xs font-semibold text-[#1B2130]">Data</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className={plainInputClass}
            />
          </div>
          <button
            type="button"
            onClick={handleRegistrar}
            disabled={salvando}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#FF7518] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#e6690f] disabled:opacity-60"
          >
            {salvando ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Plus size={15} />
            )}
            Registrar
          </button>
        </div>
      )}

      {erro && <p className="px-5 py-3 text-sm text-red-500">{erro}</p>}

      {carregando ? (
        <div className="flex items-center justify-center gap-2 p-6 text-sm text-gray-500">
          <Loader2 size={16} className="animate-spin" />
          Carregando pagamentos...
        </div>
      ) : pagamentos.length === 0 ? (
        <div className="p-6 text-center text-sm text-gray-400">
          Nenhum pagamento registrado.
        </div>
      ) : (
        <ul className="divide-y divide-gray-50 border-t border-gray-100">
          {pagamentos.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
            >
              <div className={p.estornado ? "text-gray-400" : "text-[#1F1F1F]"}>
                <span>{new Date(p.data).toLocaleDateString("pt-BR")}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {FORMAS.find((f) => f.value === p.forma_pagamento)?.label ??
                    "Lançamento automático"}
                </span>
                {p.estornado && (
                  <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                    Estornado
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={`font-medium ${p.estornado ? "text-gray-400 line-through" : "text-[#1F1F1F]"}`}
                >
                  {formatCurrency(p.valor)}
                </span>
                {podeGerenciar && !p.estornado && (
                  <button
                    type="button"
                    onClick={() => handleEstornar(p)}
                    disabled={estornandoId === p.id}
                    aria-label="Estornar pagamento"
                    title="Estornar pagamento"
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
                  >
                    {estornandoId === p.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Undo2 size={15} />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
