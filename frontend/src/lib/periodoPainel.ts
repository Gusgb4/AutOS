// Período dos cards e blocos do Financeiro e com o que eles se comparam.
// Abre sempre no mês atual; a lista de lançamentos tem os próprios filtros.
// A tela fica em components/financial/PainelPeriodo.tsx.

export type ModoPeriodo = "mes" | "mes_passado" | "livre";
export type ModoComparacao = "anterior" | "ano" | "livre";

export interface EstadoPainel {
  periodo: ModoPeriodo;
  inicio: string;
  fim: string;
  comparacao: ModoComparacao;
  compInicio: string;
  compFim: string;
}

export const PAINEL_INICIAL: EstadoPainel = {
  periodo: "mes",
  inicio: "",
  fim: "",
  comparacao: "anterior",
  compInicio: "",
  compFim: "",
};

// O que vai para a API; undefined = deixa o backend decidir
export interface ConsultaPainel {
  inicio?: string;
  fim?: string;
  compararInicio?: string;
  compararFim?: string;
}

function iso(ano: number, mes: number, dia: number) {
  return `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
}

// Mês inteiro (mes de 1 a 12; aceita 0 e 13 e ajusta o ano)
function mesInteiro(ano: number, mes: number) {
  const data = new Date(Date.UTC(ano, mes - 1, 1));
  const a = data.getUTCFullYear();
  const m = data.getUTCMonth() + 1;
  const ultimo = new Date(Date.UTC(a, m, 0)).getUTCDate();
  return { inicio: iso(a, m, 1), fim: iso(a, m, ultimo) };
}

// "2026-10-22" vira "2025-10-22"; 29/02 vira 28/02
function umAnoAntes(data: string) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const ultimo = new Date(Date.UTC(ano - 1, mes, 0)).getUTCDate();
  return iso(ano - 1, mes, Math.min(dia, ultimo));
}

/** Converte o que está na tela nas datas que vão para a API. */
export function calcularConsulta(e: EstadoPainel): ConsultaPainel | null {
  const hoje = new Date();
  const anoAtual = hoje.getFullYear();
  const mesAtual = hoje.getMonth() + 1;

  // Datas do período (no "mes" ficam vazias: o backend usa o mês atual)
  let base: { inicio: string; fim: string } | undefined;
  if (e.periodo === "mes_passado") base = mesInteiro(anoAtual, mesAtual - 1);
  if (e.periodo === "livre") {
    if (!e.inicio || !e.fim || e.inicio > e.fim) return null;
    base = { inicio: e.inicio, fim: e.fim };
  }
  const consulta: ConsultaPainel = { ...base };

  if (e.comparacao === "anterior" && e.periodo === "mes_passado") {
    // Mês passado compara com o mês inteiro anterior a ele
    const anterior = mesInteiro(anoAtual, mesAtual - 2);
    consulta.compararInicio = anterior.inicio;
    consulta.compararFim = anterior.fim;
  }
  if (e.comparacao === "ano") {
    const doPeriodo = base ?? mesInteiro(anoAtual, mesAtual);
    // Mês inteiro compara com o mesmo mês inteiro do ano passado
    const ehMesInteiro = e.periodo !== "livre";
    const [a, m] = doPeriodo.inicio.split("-").map(Number);
    const anoPassado = ehMesInteiro
      ? mesInteiro(a - 1, m)
      : { inicio: umAnoAntes(doPeriodo.inicio), fim: umAnoAntes(doPeriodo.fim) };
    consulta.compararInicio = anoPassado.inicio;
    consulta.compararFim = anoPassado.fim;
  }
  if (e.comparacao === "livre") {
    if (!e.compInicio || !e.compFim || e.compInicio > e.compFim) return null;
    consulta.compararInicio = e.compInicio;
    consulta.compararFim = e.compFim;
  }
  return consulta;
}
