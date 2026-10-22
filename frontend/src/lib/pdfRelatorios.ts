import type { jsPDF } from "jspdf";
import type { Styles } from "jspdf-autotable";
import type {
  AtividadeClientes,
  PeriodoDatas,
  ResumoFinanceiro,
  StatusInventario,
  VendasPorPeriodo,
} from "../services/reports";
import {
  MARGEM,
  carregarLogo,
  criarPdf,
  desenharCabecalho,
  desenharRodape,
  desenharTabela,
  formatarMoeda,
} from "./pdf";
import { formatarDecimal } from "./estoque";
import {
  formatDate,
  formatPercent,
  tabelaCaixa,
  tabelaClientes,
  tabelaFaturamento,
  tabelaIndicadoresAtividade,
  tabelaIndicadoresConsumo,
  tabelaIndicadoresVendas,
  tabelaMargemPecas,
  tabelaPecasConsumidas,
  tabelaPosicaoEstoque,
  tabelaPrevisaoFalta,
  tabelaRecebidoPorForma,
  tabelaVendasPorDia,
  type Celula,
  type Formatador,
  type TabelaRelatorio,
} from "./relatorios";

// PDFs da tela de relatórios. As tabelas vêm de relatorios.ts, as mesmas do CSV;
// aqui só se decide como cada valor aparece no papel.

// As mesmas cores de pdf.ts
type Cor = [number, number, number];
const COR_TEXTO: Cor = [31, 31, 31];
const COR_SECUNDARIA: Cor = [107, 114, 128];

// A fonte padrão do PDF não tem as setas da tela, então a variação leva o sinal
const FORMATO_PDF: Formatador = {
  moeda: formatarMoeda,
  percentual: formatPercent,
  variacao: (valor) => {
    if (valor === null) return null;
    const sinal = valor > 0 ? "+" : valor < 0 ? "-" : "";
    return `${sinal}${formatPercent(Math.abs(valor))}`;
  },
  decimal: formatarDecimal,
};

// Sem valor (categoria, fornecedor, variação sem base de comparação): traço, como na tela
function textoCelula(celula: Celula) {
  return celula === null ? "—" : String(celula);
}

/**
 * Cabeçalho com o período do relatório e, logo abaixo, o período anterior
 * usado no comparativo. Devolve o Y em que o conteúdo deve começar.
 */
function desenharInicio(
  doc: jsPDF,
  titulo: string,
  inicio: string,
  fim: string,
  anterior: PeriodoDatas,
  aviso?: string,
): number {
  const y = desenharCabecalho(
    doc,
    titulo,
    `${formatDate(inicio)} a ${formatDate(fim)}`,
  );
  const comparativo = `Comparado com o período anterior: ${formatDate(anterior.inicio)} a ${formatDate(anterior.fim)}.`;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_SECUNDARIA);
  const linhas: string[] = doc.splitTextToSize(
    aviso ? `${comparativo} ${aviso}` : comparativo,
    doc.internal.pageSize.getWidth() - 2 * MARGEM,
  );
  doc.text(linhas, MARGEM, y);
  return y + linhas.length * 4.5 + 2;
}

// Título de seção; perto do fim da página, a seção começa na página seguinte
function desenharTitulo(doc: jsPDF, y: number, texto: string): number {
  let yTitulo = y;
  if (yTitulo > doc.internal.pageSize.getHeight() - 60) {
    doc.addPage();
    yTitulo = MARGEM + 5;
  }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...COR_TEXTO);
  doc.text(texto, MARGEM, yTitulo);
  return yTitulo + 4;
}

// Números lado a lado, como os cartões da tela
function desenharNumeros(
  doc: jsPDF,
  y: number,
  numeros: [string, string][],
): number {
  return desenharTabela(doc, y, {
    theme: "plain",
    head: [numeros.map(([rotulo]) => rotulo)],
    body: [numeros.map(([, valor]) => valor)],
    styles: { fontSize: 11, fontStyle: "bold" },
    headStyles: {
      fillColor: false,
      textColor: COR_SECUNDARIA,
      fontSize: 8,
      fontStyle: "normal",
    },
  });
}

function desenharTabelaRelatorio(
  doc: jsPDF,
  y: number,
  tabela: TabelaRelatorio,
): number {
  // O autoTable não aplica columnStyles ao cabeçalho: o alinhamento vai nos dois
  const estilos = tabela.colunas.map(
    (c): Partial<Styles> => ({ halign: c.direita ? "right" : "left" }),
  );
  return desenharTabela(doc, y, {
    head: [
      tabela.colunas.map((c, i) => ({ content: c.titulo, styles: estilos[i] })),
    ],
    body:
      tabela.linhas.length > 0
        ? tabela.linhas.map((linha) =>
            // Linhas mais curtas que o cabeçalho (como "Outras receitas") completam com vazio
            tabela.colunas.map((_, i) =>
              i < linha.length ? textoCelula(linha[i]) : "",
            ),
          )
        : [
            [
              {
                content: tabela.vazio ?? "",
                colSpan: tabela.colunas.length,
                styles: { halign: "center", fontStyle: "italic" },
              },
            ],
          ],
    columnStyles: Object.fromEntries(estilos.map((s, i) => [i, s])),
  });
}

export async function baixarPdfVendas(
  vendas: VendasPorPeriodo,
  inicio: string,
  fim: string,
) {
  await carregarLogo();
  const doc = criarPdf();
  let y = desenharInicio(
    doc,
    "Vendas por período",
    inicio,
    fim,
    vendas.periodo_anterior,
    vendas.anterior.ordens === 0
      ? "Não houve vendas nesse período, então não há variação para mostrar."
      : undefined,
  );
  y = desenharTabelaRelatorio(
    doc,
    y,
    tabelaIndicadoresVendas(vendas, FORMATO_PDF),
  );
  desenharTabelaRelatorio(doc, y + 6, tabelaVendasPorDia(vendas, FORMATO_PDF));
  desenharRodape(doc);
  doc.save(`vendas-${inicio}-a-${fim}.pdf`);
}

export async function baixarPdfInventario(
  inventario: StatusInventario,
  inicio: string,
  fim: string,
) {
  await carregarLogo();
  const doc = criarPdf();
  let y = desenharInicio(
    doc,
    "Status do inventário",
    inicio,
    fim,
    inventario.consumo.periodo_anterior,
  );
  y = desenharTabelaRelatorio(
    doc,
    y,
    tabelaIndicadoresConsumo(inventario, FORMATO_PDF),
  );
  y = desenharTabelaRelatorio(
    doc,
    y + 6,
    tabelaPecasConsumidas(inventario, FORMATO_PDF),
  );

  const posicao = tabelaPosicaoEstoque(inventario, FORMATO_PDF);
  if (posicao.titulo) y = desenharTitulo(doc, y + 10, posicao.titulo);
  y = desenharNumeros(doc, y, [
    ["Total de itens", String(inventario.resumo.total_itens)],
    ["Abaixo do mínimo", String(inventario.resumo.abaixo_minimo)],
    ["Valor em estoque", formatarMoeda(inventario.resumo.valor_total)],
  ]);
  y = desenharTabelaRelatorio(doc, y + 2, posicao);

  const previsao = tabelaPrevisaoFalta(inventario, FORMATO_PDF);
  if (previsao.titulo) y = desenharTitulo(doc, y + 10, previsao.titulo);
  desenharTabelaRelatorio(doc, y, previsao);
  desenharRodape(doc);
  doc.save(`inventario-${inicio}-a-${fim}.pdf`);
}

export async function baixarPdfResumoFinanceiro(
  resumo: ResumoFinanceiro,
  inicio: string,
  fim: string,
) {
  await carregarLogo();
  const doc = criarPdf();
  let y = desenharInicio(
    doc,
    "Resumo financeiro",
    inicio,
    fim,
    resumo.periodo_anterior,
  );
  y = desenharTabelaRelatorio(doc, y, tabelaCaixa(resumo, FORMATO_PDF));
  y = desenharTabelaRelatorio(
    doc,
    y + 6,
    tabelaRecebidoPorForma(resumo, FORMATO_PDF),
  );
  y = desenharTabelaRelatorio(
    doc,
    y + 6,
    tabelaFaturamento(resumo, FORMATO_PDF),
  );
  desenharTabelaRelatorio(doc, y + 6, tabelaMargemPecas(resumo, FORMATO_PDF));
  desenharRodape(doc);
  doc.save(`resumo-financeiro-${inicio}-a-${fim}.pdf`);
}

export async function baixarPdfAtividadeClientes(
  atividade: AtividadeClientes,
  inicio: string,
  fim: string,
) {
  await carregarLogo();
  const doc = criarPdf();
  let y = desenharInicio(
    doc,
    "Atividade do cliente",
    inicio,
    fim,
    atividade.periodo_anterior,
  );
  y = desenharTabelaRelatorio(
    doc,
    y,
    tabelaIndicadoresAtividade(atividade, FORMATO_PDF),
  );
  desenharTabelaRelatorio(doc, y + 6, tabelaClientes(atividade, FORMATO_PDF));
  desenharRodape(doc);
  doc.save(`atividade-clientes-${inicio}-a-${fim}.pdf`);
}
