import type { PrevisaoFalta, SituacaoPrevisao } from "../services/stock";

// A previsão de falta vem calculada do backend; aqui só se escolhe o texto e a cor.
// O mesmo texto vai para a tela de Estoque, o relatório de inventário, o CSV e o PDF.

export function textoPrevisaoFalta(previsao: PrevisaoFalta): string {
  switch (previsao.situacao) {
    case "ESGOTADO":
      return "Esgotado";
    case "SEM_CONSUMO":
      return "Sem consumo em 90 dias";
    case "MENOS_DE_1_SEMANA":
      return "Acaba em menos de 1 semana";
    case "MAIS_DE_1_ANO":
      return "Mais de 1 ano de estoque";
    case "SEMANAS":
      return `Acaba em cerca de ${previsao.semanas} ${previsao.semanas === 1 ? "semana" : "semanas"}`;
  }
}

const COR_PREVISAO: Record<SituacaoPrevisao, string> = {
  ESGOTADO: "font-medium text-red-600",
  MENOS_DE_1_SEMANA: "font-medium text-red-600",
  SEMANAS: "text-gray-700",
  SEM_CONSUMO: "text-gray-400",
  MAIS_DE_1_ANO: "text-gray-400",
};

export function corPrevisaoFalta(situacao: SituacaoPrevisao) {
  return COR_PREVISAO[situacao];
}

// Média por mês com até 1 casa: 1,3
export function formatarDecimal(valor: number) {
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 });
}
