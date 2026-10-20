import type { CellDef, Styles } from "jspdf-autotable";
import type { ServiceOrder } from "../services/serviceOrders";
import {
  criarPdf,
  desenharCabecalho,
  desenharRodape,
  desenharTabela,
  formatarData,
  formatarMoeda,
} from "./pdf";

// Usados no cabeçalho e no corpo da tabela: o autoTable não aplica columnStyles
// ao cabeçalho, e sem isso a largura se perde quando a tabela está vazia
const COLUNA_QTD: Partial<Styles> = { halign: "center", cellWidth: 18 };
const COLUNA_VALOR: Partial<Styles> = { halign: "right", cellWidth: 32 };

function linhaVazia(texto: string, colunas: number): CellDef[] {
  return [
    {
      content: texto,
      colSpan: colunas,
      styles: { halign: "center", fontStyle: "italic" },
    },
  ];
}

/**
 * Gera e baixa o PDF da OS: "Orçamento" enquanto não está finalizada e
 * "Comprovante de serviço" depois. Só usa o preço de venda das peças:
 * custo e margem nunca entram neste documento.
 */
export function baixarPdfOrdemServico(ordem: ServiceOrder) {
  const finalizada = ordem.status === "FINALIZADA";
  const doc = criarPdf();

  let y = desenharCabecalho(
    doc,
    finalizada ? "Comprovante de serviço" : "Orçamento",
    `OS nº ${ordem.id}`,
  );

  const { cliente, veiculo } = ordem;
  const quilometragem =
    ordem.quilometragem_registrada !== null
      ? `${ordem.quilometragem_registrada.toLocaleString("pt-BR")} km`
      : "Não informada";

  y = desenharTabela(doc, y, {
    theme: "plain",
    body: [
      [
        "Cliente",
        cliente.nome,
        "Veículo",
        `${veiculo.marca} ${veiculo.modelo} (${veiculo.ano})`,
      ],
      ["Telefone", cliente.telefone, "Placa", veiculo.placa],
      [
        "Data de abertura",
        formatarData(ordem.created_at),
        "Quilometragem",
        quilometragem,
      ],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 32 },
      2: { fontStyle: "bold", cellWidth: 30 },
    },
  });

  y = desenharTabela(doc, y + 6, {
    head: [["Serviço", { content: "Valor", styles: COLUNA_VALOR }]],
    body:
      ordem.servicos.length > 0
        ? ordem.servicos.map((s) => [s.descricao, formatarMoeda(s.valor)])
        : [linhaVazia("Nenhum serviço.", 2)],
    columnStyles: { 1: COLUNA_VALOR },
  });

  y = desenharTabela(doc, y + 6, {
    head: [
      [
        "Peça",
        { content: "Qtd.", styles: COLUNA_QTD },
        { content: "Valor unit.", styles: COLUNA_VALOR },
        { content: "Subtotal", styles: COLUNA_VALOR },
      ],
    ],
    body:
      ordem.pecas.length > 0
        ? ordem.pecas.map((p) => [
            p.item_estoque.nome,
            String(p.quantidade),
            formatarMoeda(p.valor_unitario),
            formatarMoeda(Number(p.valor_unitario) * p.quantidade),
          ])
        : [linhaVazia("Nenhuma peça.", 4)],
    columnStyles: { 1: COLUNA_QTD, 2: COLUNA_VALOR, 3: COLUNA_VALOR },
  });

  y = desenharTabela(doc, y + 4, {
    theme: "plain",
    body: [["Valor total", formatarMoeda(ordem.valor_total)]],
    styles: { fontSize: 11, fontStyle: "bold" },
    columnStyles: {
      0: { halign: "right" },
      1: { halign: "right", cellWidth: 40 },
    },
  });

  const observacoes = ordem.observacoes?.trim();
  if (observacoes) {
    desenharTabela(doc, y + 6, {
      theme: "grid",
      head: [["Observações"]],
      body: [[observacoes]],
    });
  }

  desenharRodape(doc);
  doc.save(`${finalizada ? "comprovante" : "orcamento"}-os-${ordem.id}.pdf`);
}
