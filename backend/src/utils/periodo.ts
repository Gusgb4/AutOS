// Períodos de datas no fuso de Brasília, usados pelos relatórios e pelo financeiro

export const FUSO = "-03:00";
const TRES_HORAS_MS = 3 * 60 * 60 * 1000;
export const UM_DIA_MS = 24 * 60 * 60 * 1000;

export interface Periodo {
  inicio: Date;
  fimExclusivo: Date;
}

// "2026-10-01" a "2026-10-31" (fim inclusivo), no fuso de Brasília
export function parsePeriodo(inicio: string, fim: string): Periodo {
  const dataInicio = new Date(`${inicio}T00:00:00${FUSO}`);
  const dataFim = new Date(`${fim}T00:00:00${FUSO}`);
  return {
    inicio: dataInicio,
    fimExclusivo: new Date(dataFim.getTime() + UM_DIA_MS),
  };
}

// Período de mesma duração imediatamente antes
export function periodoAnterior(p: Periodo): Periodo {
  const duracao = p.fimExclusivo.getTime() - p.inicio.getTime();
  return {
    inicio: new Date(p.inicio.getTime() - duracao),
    fimExclusivo: p.inicio,
  };
}

export function diaBrasilia(data: Date): string {
  return new Date(data.getTime() - TRES_HORAS_MS).toISOString().slice(0, 10);
}

export function descreverPeriodo(p: Periodo) {
  return {
    inicio: diaBrasilia(p.inicio),
    fim: diaBrasilia(new Date(p.fimExclusivo.getTime() - 1)),
  };
}

// Mês inteiro (deslocamento 0 = mês atual, -1 = mês anterior), em Brasília
export function mesBrasilia(deslocamento = 0, agora = new Date()): Periodo {
  const [ano, mes] = diaBrasilia(agora).split("-").map(Number);
  // Date.UTC normaliza meses fora de 1..12 (ex.: mês 0 vira dezembro do ano anterior)
  const primeiro = new Date(Date.UTC(ano, mes - 1 + deslocamento, 1));
  const ultimo = new Date(Date.UTC(ano, mes + deslocamento, 0));
  return parsePeriodo(
    primeiro.toISOString().slice(0, 10),
    ultimo.toISOString().slice(0, 10),
  );
}

// Variação percentual com uma casa decimal; null quando não há base de comparação.
// O denominador é absoluto para um saldo anterior negativo não inverter o sinal.
export function variacao(atual: number, anterior: number): number | null {
  if (anterior === 0) return null;
  return Math.round(((atual - anterior) / Math.abs(anterior)) * 1000) / 10;
}
