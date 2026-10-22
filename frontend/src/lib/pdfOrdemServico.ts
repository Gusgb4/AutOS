import type { jsPDF } from "jspdf";
import type { CellDef, Styles, UserOptions } from "jspdf-autotable";
import type { ServiceOrder } from "../services/serviceOrders";
import { OFICINA } from "../config/oficina";
import {
  carregarLogo,
  criarPdf,
  desenharAssinaturas,
  desenharCabecalho,
  desenharRodape,
  desenharTabela,
  formatarData,
  formatarMoeda,
} from "./pdf";

// A OS é impressa e entregue ao cliente: tudo em preto e cinza, sem o laranja
// do sistema, e compacta pra caber numa página só
type Cor = [number, number, number];
const PRETO: Cor = [31, 31, 31];
const CINZA: Cor = [107, 114, 128];
const CINZA_CLARO: Cor = [232, 232, 232];

// Texto da nota de entrega, acima das assinaturas
const DECLARACAO_ENTREGA =
  "Declaro estar recebendo o veículo com os serviços descritos nesta nota executados.";

// Se não couber numa página, o PDF é montado de novo com letra menor
const ESCALAS = [1, 0.9, 0.8];

function linhaVazia(texto: string, colunas: number): CellDef[] {
  return [
    {
      content: texto,
      colSpan: colunas,
      styles: { halign: "center", fontStyle: "italic", textColor: CINZA },
    },
  ];
}

/**
 * Monta o PDF numa escala de letra/espaço. Devolve o documento pronto
 * (o rodapé é desenhado por último, então já sabe o total de páginas).
 */
function montar(ordem: ServiceOrder, escala: number): jsPDF {
  const finalizada = ordem.status === "FINALIZADA";
  const doc = criarPdf();
  const fonte = 8.5 * escala;
  const espaco = 3 * escala;

  // Visual comum das tabelas desta OS
  const tabela = (y: number, opcoes: UserOptions, margemEsquerda?: number) =>
    desenharTabela(
      doc,
      y,
      {
      ...opcoes,
      styles: {
        fontSize: fonte,
        cellPadding: 1.3 * escala,
        textColor: PRETO,
        ...opcoes.styles,
      },
      headStyles: {
        fillColor: CINZA_CLARO,
        textColor: PRETO,
        fontStyle: "bold",
        ...opcoes.headStyles,
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      },
      margemEsquerda,
    );

  // Usados no cabeçalho e no corpo: o autoTable não aplica columnStyles
  // ao cabeçalho, e sem isso a largura se perde quando a tabela está vazia
  const colunaQtd: Partial<Styles> = { halign: "center", cellWidth: 16 };
  const colunaValor: Partial<Styles> = { halign: "right", cellWidth: 30 };


  let y = desenharCabecalho(
    doc,
    finalizada ? "Nota de entrega" : "Orçamento",
    `OS nº ${ordem.id}`,
    { monocromatico: true },
  );

  const { cliente, veiculo } = ordem;
  const quilometragem =
    ordem.quilometragem_registrada !== null
      ? `${ordem.quilometragem_registrada.toLocaleString("pt-BR")} km`
      : "Não informada";

  y = tabela(y, {
    theme: "plain",
    body: [
      [
        "Cliente",
        cliente.nome,
        "Veículo",
        `${veiculo.marca} ${veiculo.modelo} (${veiculo.ano})`,
      ],
      // Cliente com dados removidos (LGPD) fica sem telefone
      [
        "Telefone",
        cliente.telefone || "—",
        "Placa / cor",
        veiculo.cor ? `${veiculo.placa} · ${veiculo.cor}` : veiculo.placa,
      ],
      // Na nota vai a saída; no orçamento, a previsão (CDC, art. 40)
      [
        "Entrada",
        formatarData(ordem.created_at),
        finalizada ? "Saída" : "Previsão",
        finalizada
          ? ordem.finalizada_em
            ? formatarData(ordem.finalizada_em)
            : "—"
          : ordem.previsao_entrega
            ? formatarData(ordem.previsao_entrega)
            : "A combinar",
      ],
      ["Mecânico", ordem.mecanico.nome, "Quilometragem", quilometragem],
    ],
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 26 },
      2: { fontStyle: "bold", cellWidth: 26 },
    },
  });

  const reclamacao = ordem.reclamacao?.trim();
  if (reclamacao) {
    y = tabela(y + espaco, {
      theme: "grid",
      head: [["Reclamação do cliente"]],
      body: [[reclamacao]],
      styles: { lineColor: CINZA_CLARO },
    });
  }

  y = tabela(y + espaco, {
    head: [
      [
        finalizada ? "Serviços executados" : "Serviço",
        { content: "Valor", styles: colunaValor },
      ],
    ],
    body:
      ordem.servicos.length > 0
        ? ordem.servicos.map((s) => [s.descricao, formatarMoeda(s.valor)])
        : [linhaVazia("Nenhum serviço.", 2)],
    columnStyles: { 1: colunaValor },
  });

  y = tabela(y + espaco, {
    head: [
      [
        "Peça",
        { content: "Qtd.", styles: colunaQtd },
        { content: "Valor unit.", styles: colunaValor },
        { content: "Subtotal", styles: colunaValor },
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
    columnStyles: { 1: colunaQtd, 2: colunaValor, 3: colunaValor },
  });

  const maoDeObra = ordem.servicos.reduce((acc, s) => acc + Number(s.valor), 0);
  const pecas = ordem.pecas.reduce(
    (acc, p) => acc + Number(p.valor_unitario) * p.quantidade,
    0,
  );

  // Sem pagamento aqui: a nota é impressa quando o cliente vem buscar o carro,
  // muitas vezes antes de pagar. O pagamento fica registrado no sistema.
  // Mesmo formato das tabelas de serviços e peças
  y = tabela(y + espaco, {
    head: [["Totais", { content: "Valor", styles: colunaValor }]],
    body: [
      ["Mão de obra", formatarMoeda(maoDeObra)],
      ["Peças", formatarMoeda(pecas)],
      [
        { content: "Valor total", styles: { fontStyle: "bold" } },
        {
          content: formatarMoeda(ordem.valor_total),
          styles: { fontStyle: "bold" },
        },
      ],
    ],
    columnStyles: { 1: colunaValor },
  });

  const observacoes = ordem.observacoes?.trim();
  if (observacoes) {
    y = tabela(y + espaco, {
      theme: "grid",
      head: [["Informações ao cliente"]],
      body: [[observacoes]],
      styles: { lineColor: CINZA_CLARO },
    });
  }

  // Na entrega do carro: o cliente confere e assina a nota
  if (finalizada) {
    desenharAssinaturas(
      doc,
      y + espaco * 2,
      ["Cliente", OFICINA.nome],
      DECLARACAO_ENTREGA,
      // No pé da página, logo acima do rodapé, como no bloco de nota impresso
      true,
    );
  }

  desenharRodape(doc);
  return doc;
}

/**
 * Gera e baixa o PDF da OS: "Orçamento" enquanto não está finalizada e
 * "Nota de entrega" depois (o nome que a oficina já usava). OS cancelada não
 * gera PDF (o botão some). Só usa o preço de venda das peças: custo e margem
 * nunca entram aqui.
 */
export async function baixarPdfOrdemServico(ordem: ServiceOrder) {
  await carregarLogo();

  // Tenta caber numa página; se nem na menor escala couber, vai com ela mesmo
  let doc = montar(ordem, ESCALAS[0]);
  for (const escala of ESCALAS.slice(1)) {
    if (doc.getNumberOfPages() === 1) break;
    doc = montar(ordem, escala);
  }

  const finalizada = ordem.status === "FINALIZADA";
  doc.save(`${finalizada ? "nota-de-entrega" : "orcamento"}-os-${ordem.id}.pdf`);
}
