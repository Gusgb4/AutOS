import { jsPDF } from "jspdf";
import autoTable, { type UserOptions } from "jspdf-autotable";
import { OFICINA } from "../config/oficina";
import logoUrl from "../assets/logo-oficina.png";

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

// ---------- Logo da oficina ----------
interface Logo {
  dataUrl: string;
  proporcao: number; // largura / altura
}

// Fração cortada em cima e embaixo da logo (as laterais ficam inteiras):
// a imagem da oficina tem uma faixa preta sobrando nas duas pontas
const CORTE_VERTICAL = 0.22;

function cortarLogo(imagem: HTMLImageElement): Logo {
  const largura = imagem.naturalWidth;
  const corte = Math.round(imagem.naturalHeight * CORTE_VERTICAL);
  const altura = imagem.naturalHeight - 2 * corte;

  const canvas = document.createElement("canvas");
  canvas.width = largura;
  canvas.height = altura;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas indisponível");
  ctx.drawImage(imagem, 0, corte, largura, altura, 0, 0, largura, altura);

  return {
    // JPEG deixa o PDF bem menor; o fundo é preto, então não perde nada
    dataUrl: canvas.toDataURL("image/jpeg", 0.92),
    proporcao: largura / altura,
  };
}
let logoPronta: Promise<Logo | null> | null = null;
let logo: Logo | null = null;

/**
 * Prepara a logo uma vez só (as próximas chamadas reaproveitam).
 * Chame antes de gerar o PDF. Se falhar, o cabeçalho sai só com o nome.
 */
export function carregarLogo(): Promise<Logo | null> {
  logoPronta ??= new Promise<Logo | null>((resolve) => {
    const imagem = new Image();
    imagem.onload = () => {
      try {
        logo = cortarLogo(imagem);
      } catch (erro) {
        console.error(erro);
        logo = null;
      }
      resolve(logo);
    };
    imagem.onerror = () => resolve(null);
    imagem.src = logoUrl;
  });
  return logoPronta;
}

/**
 * Logo (ou nome) e dados da oficina à esquerda; título do documento à direita.
 * `monocromatico` troca o laranja por preto (usado na OS, que é impressa).
 * Devolve o Y em que o conteúdo deve começar.
 */
export function desenharCabecalho(
  doc: jsPDF,
  titulo: string,
  subtitulo?: string,
  opcoes: { monocromatico?: boolean } = {},
): number {
  const direita = doc.internal.pageSize.getWidth() - MARGEM;
  const larguraOficina = 110;
  const destaque = opcoes.monocromatico ? COR_TEXTO : COR_PRINCIPAL;

  let yOficina: number;
  if (logo) {
    // Logo com 18 mm de altura (a largura acompanha a proporção)
    const altura = 18;
    const largura = altura * logo.proporcao;
    doc.addImage(logo.dataUrl, "JPEG", MARGEM, MARGEM, largura, altura);
    yOficina = MARGEM + altura + 4;
  } else {
    yOficina = MARGEM + 5;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(...COR_TEXTO);
    const linhasNome: string[] = doc.splitTextToSize(OFICINA.nome, larguraOficina);
    for (const linha of linhasNome) {
      doc.text(linha, MARGEM, yOficina);
      yOficina += 6;
    }
  }

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...COR_SECUNDARIA);
  const linhasDados: string[] = [
    `CNPJ: ${OFICINA.cnpj}`,
    OFICINA.endereco,
    `Telefone: ${OFICINA.telefone}`,
  ].flatMap((texto) => doc.splitTextToSize(texto, larguraOficina));
  for (const linha of linhasDados) {
    doc.text(linha, MARGEM, yOficina);
    yOficina += 4;
  }

  let yTitulo = MARGEM + 6;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(...destaque);
  doc.text(titulo, direita, yTitulo, { align: "right" });
  if (subtitulo) {
    yTitulo += 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...COR_TEXTO);
    doc.text(subtitulo, direita, yTitulo, { align: "right" });
  }

  const y = Math.max(yOficina, yTitulo);
  doc.setDrawColor(...destaque);
  doc.setLineWidth(opcoes.monocromatico ? 0.4 : 0.6);
  doc.line(MARGEM, y, direita, y);
  return y + 5;
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
 * Linhas de assinatura lado a lado, com o rótulo embaixo de cada uma e,
 * opcionalmente, uma declaração em cima. Texto e linhas ficam sempre juntos:
 * se não couber no fim da página, vai tudo pra próxima. Com `noPe`, o bloco
 * desce até logo acima do rodapé (sobe só se o conteúdo já chegou lá).
 * Devolve o Y abaixo.
 */
export function desenharAssinaturas(
  doc: jsPDF,
  y: number,
  rotulos: string[],
  declaracao?: string,
  noPe = false,
) {
  const largura = doc.internal.pageSize.getWidth();
  const altura = doc.internal.pageSize.getHeight();

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const linhasDeclaracao: string[] = declaracao
    ? doc.splitTextToSize(declaracao, largura - 2 * MARGEM)
    : [];
  const alturaDeclaracao = linhasDeclaracao.length * 4.5;
  // Espaço em branco pra assinar, mais a linha e o rótulo
  const alturaBloco = alturaDeclaracao + 22;

  const limite = altura - ESPACO_RODAPE;
  let topo = y;
  if (topo + alturaBloco > limite) {
    doc.addPage();
    topo = MARGEM;
  }
  if (noPe) topo = Math.max(topo, limite - alturaBloco);

  if (linhasDeclaracao.length > 0) {
    doc.setTextColor(...COR_TEXTO);
    linhasDeclaracao.forEach((linha, i) => {
      doc.text(linha, MARGEM, topo + 4 + i * 4.5);
    });
    topo += alturaDeclaracao;
  }

  const espacoEntre = 12;
  const larguraLinha =
    (largura - 2 * MARGEM - espacoEntre * (rotulos.length - 1)) /
    rotulos.length;
  const yLinha = topo + 15;

  doc.setDrawColor(...COR_TEXTO);
  doc.setLineWidth(0.3);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...COR_SECUNDARIA);
  rotulos.forEach((rotulo, i) => {
    const x = MARGEM + i * (larguraLinha + espacoEntre);
    doc.line(x, yLinha, x + larguraLinha, yLinha);
    doc.text(rotulo, x + larguraLinha / 2, yLinha + 5, { align: "center" });
  });

  return topo + 22;
}

/**
 * Tabela no visual do sistema, quebrando página sem invadir o rodapé.
 * `margemEsquerda` permite empurrar uma tabela estreita pra direita
 * (ex.: o quadro de totais da OS). Devolve o Y logo abaixo da tabela.
 */
export function desenharTabela(
  doc: jsPDF,
  y: number,
  opcoes: UserOptions,
  margemEsquerda = MARGEM,
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
      left: margemEsquerda,
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
