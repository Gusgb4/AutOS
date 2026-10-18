import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import { OFICINA } from "../config/oficina";

// Partes comuns a todos os PDFs do sistema (cabeçalho, rodapé e tabelas).
// O conteúdo de cada documento fica em um arquivo próprio, como pdfOrdemServico.ts.

// Medidas em milímetros, página A4
export const MARGEM = 15;
// Espaço reservado no fim de cada página para o rodapé
const ESPACO_RODAPE = 20;

type Cor = [number, number, number];
const COR_PRINCIPAL: Cor = [255, 117, 24]; // #FF7518
const COR_TEXTO: Cor = [31, 31, 31]; // #1F1F1F
const COR_SECUNDARIA: Cor = [107, 114, 128];
const COR_LINHA: Cor = [229, 231, 235];

export function formatarMoeda(valor: string | number) {
  return Number(valor)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

export function formatarData(valor: string | Date) {
  return new Date(valor).toLocaleDateString("pt-BR");
}

export function criarPdf() {
  return new jsPDF({ unit: "mm", format: "a4" });
}

/**
 * Dados da oficina à esquerda e título do documento à direita.
 * Devolve o Y em que o conteúdo deve começar.
 */
export function desenharCabecalho(
  doc: jsPDF,
  titulo: string,
  subtitulo?: string,
): number {
  const direita = doc.internal.pageSize.getWidth() - MARGEM;
  const larguraOficina = 110;

  let yOficina = MARGEM + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(...COR_TEXTO);
  const linhasNome: string[] = doc.splitTextToSize(OFICINA.nome, larguraOficina);
  for (const linha of linhasNome) {
    doc.text(linha, MARGEM, yOficina);
    yOficina += 6;
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_SECUNDARIA);
  const linhasDados: string[] = [
    `CNPJ: ${OFICINA.cnpj}`,
    OFICINA.endereco,
    `Telefone: ${OFICINA.telefone}`,
  ].flatMap((texto) => doc.splitTextToSize(texto, larguraOficina));
  for (const linha of linhasDados) {
    doc.text(linha, MARGEM, yOficina);
    yOficina += 4.5;
  }

  let yTitulo = MARGEM + 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(...COR_PRINCIPAL);
  doc.text(titulo, direita, yTitulo, { align: "right" });
  if (subtitulo) {
    yTitulo += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COR_TEXTO);
    doc.text(subtitulo, direita, yTitulo, { align: "right" });
  }

  const y = Math.max(yOficina, yTitulo) + 2;
  doc.setDrawColor(...COR_PRINCIPAL);
  doc.setLineWidth(0.6);
  doc.line(MARGEM, y, direita, y);
  return y + 8;
}

/**
 * Data de emissão e "Página X de Y" em todas as páginas.
 * Chame depois de desenhar todo o conteúdo, para o total de páginas estar certo.
 */
export function desenharRodape(doc: jsPDF) {
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();
  const totalPaginas = doc.getNumberOfPages();
  const emissao = `Emitido em ${formatarData(new Date())}`;

  for (let pagina = 1; pagina <= totalPaginas; pagina++) {
    doc.setPage(pagina);
    doc.setDrawColor(...COR_LINHA);
    doc.setLineWidth(0.2);
    doc.line(MARGEM, altura - 14, largura - MARGEM, altura - 14);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...COR_SECUNDARIA);
    doc.text(emissao, MARGEM, altura - 9);
    doc.text(`Página ${pagina} de ${totalPaginas}`, largura - MARGEM, altura - 9, {
      align: "right",
    });
  }
}

/**
 * Tabela no visual do sistema, quebrando página sem invadir o rodapé.
 * Devolve o Y logo abaixo da tabela.
 */
export function desenharTabela(
  doc: jsPDF,
  y: number,
  opcoes: UserOptions,
): number {
  let finalY = y;
  autoTable(doc, {
    theme: "striped",
    ...opcoes,
    startY: y,
    margin: {
      top: MARGEM,
      right: MARGEM,
      bottom: ESPACO_RODAPE,
      left: MARGEM,
    },
    styles: {
      font: "helvetica",
      fontSize: 9,
      textColor: COR_TEXTO,
      cellPadding: 2,
      ...opcoes.styles,
    },
    headStyles: {
      fillColor: COR_PRINCIPAL,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      ...opcoes.headStyles,
    },
    // O autoTable chama este hook ao fim de cada página com a posição atual;
    // na última chamada, o cursor está logo abaixo da tabela
    didDrawPage: (data) => {
      finalY = data.cursor?.y ?? finalY;
    },
  });
  return finalY;
}
