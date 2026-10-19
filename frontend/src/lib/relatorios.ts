import type {
  AtividadeClientes,
  ResumoFinanceiro,
  StatusInventario,
  VendasPorPeriodo,
} from "../services/reports";
import { textoPrevisaoFalta } from "./estoque";

// Tabelas dos relatórios, montadas uma vez só para o CSV e o PDF terem as mesmas linhas.
// Não importa o jspdf: a tela de relatórios carrega este arquivo direto.

export type Celula = string | number | null;

export interface TabelaRelatorio {
  /** Linha de título antes do cabeçalho (no CSV, uma linha só com este texto) */
  titulo?: string;
  colunas: { titulo: string; direita?: boolean }[];
  linhas: Celula[][];
  /** Texto do PDF quando não há linhas, o mesmo da tela */
  vazio?: string;
}

/**
 * Como cada tipo de valor vai para a célula. O CSV leva o número cru
 * (o Excel faz as contas); o PDF leva o texto já formatado.
 */
export interface Formatador {
  moeda: (valor: number) => Celula;
  percentual: (valor: number) => Celula;
  variacao: (valor: number | null) => Celula;
  decimal: (valor: number) => Celula;
}

export const FORMATO_CSV: Formatador = {
  moeda: (valor) => valor,
  percentual: (valor) => valor,
  variacao: (valor) => valor,
  decimal: (valor) => valor,
};

export function formatPercent(valor: number) {
  return `${valor.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%`;
}

export function formatDate(iso: string) {
  const [ano, mes, dia] = iso.split("-");
  return `${dia}/${mes}/${ano}`;
}

export function linhasCsv(tabela: TabelaRelatorio): Celula[][] {
  return [
    ...(tabela.titulo ? [[tabela.titulo]] : []),
    tabela.colunas.map((c) => c.titulo),
    ...tabela.linhas,
  ];
}

function colunasComparativo(primeira: string) {
  return [
    { titulo: primeira },
    { titulo: "Atual", direita: true },
    { titulo: "Período anterior", direita: true },
    { titulo: "Variação (%)", direita: true },
  ];
}

export function tabelaIndicadoresVendas(
  vendas: VendasPorPeriodo,
  f: Formatador,
): TabelaRelatorio {
  const { atual, anterior, variacao } = vendas;
  return {
    colunas: colunasComparativo("Indicador"),
    linhas: [
      [
        "Faturamento",
        f.moeda(atual.total),
        f.moeda(anterior.total),
        f.variacao(variacao.total),
      ],
      [
        "OS finalizadas",
        atual.ordens,
        anterior.ordens,
        f.variacao(variacao.ordens),
      ],
      [
        "Ticket médio",
        f.moeda(atual.ticket_medio),
        f.moeda(anterior.ticket_medio),
        f.variacao(variacao.ticket_medio),
      ],
    ],
  };
}

export function tabelaVendasPorDia(
  vendas: VendasPorPeriodo,
  f: Formatador,
): TabelaRelatorio {
  return {
    colunas: [
      { titulo: "Data" },
      { titulo: "OS finalizadas", direita: true },
      { titulo: "Faturamento", direita: true },
    ],
    linhas: vendas.por_dia.map((d) => [
      formatDate(d.data),
      d.ordens,
      f.moeda(d.total),
    ]),
    vazio: "Nenhuma OS finalizada neste período.",
  };
}

export function tabelaIndicadoresConsumo(
  inventario: StatusInventario,
  f: Formatador,
): TabelaRelatorio {
  const { atual, anterior, variacao } = inventario.consumo;
  return {
    colunas: colunasComparativo("Consumo de peças (OS finalizadas)"),
    linhas: [
      [
        "Quantidade",
        atual.quantidade,
        anterior.quantidade,
        f.variacao(variacao.quantidade),
      ],
      [
        "Valor de venda",
        f.moeda(atual.valor),
        f.moeda(anterior.valor),
        f.variacao(variacao.valor),
      ],
    ],
  };
}

export function tabelaPecasConsumidas(
  inventario: StatusInventario,
  f: Formatador,
): TabelaRelatorio {
  return {
    colunas: [
      { titulo: "Peça consumida" },
      { titulo: "Categoria" },
      { titulo: "Quantidade", direita: true },
      { titulo: "Valor de venda", direita: true },
    ],
    linhas: inventario.consumo.itens.map((i) => [
      i.nome,
      i.categoria,
      i.quantidade,
      f.moeda(i.valor),
    ]),
    vazio: "Nenhuma peça consumida em OS finalizadas neste período.",
  };
}

// Traz todos os itens: o filtro "só abaixo do mínimo" da tela não entra na exportação
export function tabelaPosicaoEstoque(
  inventario: StatusInventario,
  f: Formatador,
): TabelaRelatorio {
  return {
    titulo: "Posição atual do estoque",
    colunas: [
      { titulo: "Item" },
      { titulo: "Categoria" },
      { titulo: "Fornecedor" },
      { titulo: "Quantidade", direita: true },
      { titulo: "Mínimo", direita: true },
      { titulo: "Preço de venda", direita: true },
      { titulo: "Valor em estoque", direita: true },
      { titulo: "Situação" },
    ],
    linhas: inventario.itens.map((i) => [
      i.nome,
      i.categoria,
      i.fornecedor,
      i.quantidade,
      i.quantidade_minima,
      f.moeda(i.valor_final),
      f.moeda(i.valor_em_estoque),
      i.abaixo_minimo ? "Abaixo do mínimo" : "Em estoque",
    ]),
    vazio: "Nenhum item para mostrar.",
  };
}

// Mesmas linhas da tela, na ordem do backend (do que acaba primeiro ao último)
export function tabelaPrevisaoFalta(
  inventario: StatusInventario,
  f: Formatador,
): TabelaRelatorio {
  const { periodo, itens } = inventario.previsao_falta;
  return {
    titulo: `Previsão de falta (consumo de ${formatDate(periodo.inicio)} a ${formatDate(periodo.fim)})`,
    colunas: [
      { titulo: "Item" },
      { titulo: "Categoria" },
      { titulo: "Quantidade", direita: true },
      { titulo: "Consumo (90 dias)", direita: true },
      { titulo: "Média por mês", direita: true },
      { titulo: "Previsão" },
    ],
    linhas: itens.map((i) => [
      i.nome,
      i.categoria,
      i.quantidade,
      i.consumo_90_dias,
      f.decimal(i.media_mensal),
      textoPrevisaoFalta(i),
    ]),
    vazio: "Nenhum item com consumo em OS finalizadas nos últimos 90 dias.",
  };
}

export function tabelaCaixa(
  resumo: ResumoFinanceiro,
  f: Formatador,
): TabelaRelatorio {
  const a = resumo.anterior;
  const v = resumo.variacao;
  return {
    colunas: colunasComparativo("Caixa (lançamentos no período)"),
    linhas: [
      [
        "Entradas",
        f.moeda(resumo.entradas),
        f.moeda(a.entradas),
        f.variacao(v.entradas),
      ],
      [
        "Saídas",
        f.moeda(resumo.saidas),
        f.moeda(a.saidas),
        f.variacao(v.saidas),
      ],
      ["Saldo", f.moeda(resumo.saldo), f.moeda(a.saldo), f.variacao(v.saldo)],
      [
        "Outras receitas (lançamentos sem OS)",
        f.moeda(resumo.outras_receitas),
      ],
    ],
  };
}

export function tabelaFaturamento(
  resumo: ResumoFinanceiro,
  f: Formatador,
): TabelaRelatorio {
  const c = resumo.composicao_receita_os;
  const a = resumo.anterior;
  const v = resumo.variacao;
  return {
    colunas: [
      { titulo: "Faturamento (OS finalizadas no período)" },
      { titulo: "Atual", direita: true },
      { titulo: "Percentual (%)", direita: true },
      { titulo: "Período anterior", direita: true },
      { titulo: "Variação (%)", direita: true },
    ],
    linhas: [
      [
        "Mão de obra",
        f.moeda(c.mao_de_obra.valor),
        f.percentual(c.mao_de_obra.percentual),
        f.moeda(a.mao_de_obra),
        f.variacao(v.mao_de_obra),
      ],
      [
        "Peças",
        f.moeda(c.pecas.valor),
        f.percentual(c.pecas.percentual),
        f.moeda(a.pecas),
        f.variacao(v.pecas),
      ],
      [
        "Total faturado",
        f.moeda(c.total),
        "",
        f.moeda(a.faturamento),
        f.variacao(v.faturamento),
      ],
    ],
  };
}

// Mesmas OS do faturamento; só peças com custo registrado entram na margem
export function tabelaMargemPecas(
  resumo: ResumoFinanceiro,
  f: Formatador,
): TabelaRelatorio {
  const m = resumo.margem_pecas;
  const a = resumo.anterior;
  const v = resumo.variacao;
  return {
    colunas: colunasComparativo("Margem das peças (OS finalizadas no período)"),
    linhas: [
      [
        "Custo das peças",
        f.moeda(m.custo),
        f.moeda(a.custo_pecas),
        f.variacao(v.custo_pecas),
      ],
      [
        "Margem (R$)",
        f.moeda(m.margem),
        f.moeda(a.margem_pecas),
        f.variacao(v.margem_pecas),
      ],
      ["Margem (%)", m.percentual === null ? null : f.percentual(m.percentual)],
      [
        "Peças sem custo registrado (venda, fora da margem)",
        f.moeda(m.valor_sem_custo),
      ],
    ],
  };
}

export function tabelaIndicadoresAtividade(
  atividade: AtividadeClientes,
  f: Formatador,
): TabelaRelatorio {
  const r = atividade.resumo;
  const a = atividade.anterior;
  const v = atividade.variacao;
  return {
    colunas: colunasComparativo("Indicador"),
    linhas: [
      [
        "Clientes atendidos",
        r.clientes_atendidos,
        a.clientes_atendidos,
        f.variacao(v.clientes_atendidos),
      ],
      [
        "Clientes novos",
        r.clientes_novos,
        a.clientes_novos,
        f.variacao(v.clientes_novos),
      ],
      ["OS finalizadas", r.ordens, a.ordens, f.variacao(v.ordens)],
      [
        "Total faturado",
        f.moeda(r.total),
        f.moeda(a.total),
        f.variacao(v.total),
      ],
    ],
  };
}

export function tabelaClientes(
  atividade: AtividadeClientes,
  f: Formatador,
): TabelaRelatorio {
  return {
    colunas: [
      { titulo: "Cliente" },
      { titulo: "OS finalizadas", direita: true },
      { titulo: "Total faturado", direita: true },
      { titulo: "Ticket médio", direita: true },
      { titulo: "Última finalização", direita: true },
    ],
    linhas: atividade.clientes.map((c) => [
      c.nome,
      c.ordens,
      f.moeda(c.total),
      f.moeda(c.ticket_medio),
      formatDate(c.ultima_os),
    ]),
    vazio: "Nenhum cliente com OS finalizada neste período.",
  };
}
