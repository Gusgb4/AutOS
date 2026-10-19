import { prisma } from "../config/prisma";
import { comPagamento, pagamentosAtivos } from "./serviceOrders.service";

const UM_DIA_MS = 24 * 60 * 60 * 1000;
const DIAS_AVISO_REVISAO = 7;
const KM_AVISO_REVISAO = 500;
const DIAS_PAGAMENTO_ATRASADO = 15;

export type TipoNotificacao =
  | "REVISAO_VENCIDA"
  | "REVISAO_PROXIMA"
  | "PAGAMENTO_ATRASADO"
  | "ESTOQUE_BAIXO";

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  // Rota do frontend para onde a notificação leva
  link: string;
  // Só nas revisões: dados para o botão de WhatsApp
  revisao?: {
    cliente_nome: string;
    telefone: string;
    veiculo: string;
    proxima_data: string;
    proximo_km: number;
    quilometragem_atual: number;
    vencida: boolean;
  };
}

function formatarData(data: Date): string {
  return data.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

function formatarMoeda(valor: number): string {
  return valor
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

function formatarKm(km: number): string {
  return `${km.toLocaleString("pt-BR")} km`;
}

// ---------- Revisões (vencidas e a vencer) ----------
// Vencida: data prevista já passou OU o km atual alcançou o km previsto
// (mesma regra do perfil do cliente). Próxima: ainda não venceu, mas a data
// está a até 7 dias OU faltam até 500 km. Só clientes e veículos ativos.
async function notificacoesDeRevisao(agora: Date): Promise<Notificacao[]> {
  const veiculos = await prisma.vehicle.findMany({
    where: {
      ativo: true,
      cliente: { ativo: true },
      lembrete_manutencao: { isNot: null },
    },
    include: {
      cliente: { select: { id: true, nome: true, telefone: true } },
      lembrete_manutencao: true,
    },
  });

  const limiteData = new Date(agora.getTime() + DIAS_AVISO_REVISAO * UM_DIA_MS);
  const vencidas: { data: Date; notificacao: Notificacao }[] = [];
  const proximas: { data: Date; notificacao: Notificacao }[] = [];

  for (const veiculo of veiculos) {
    const lembrete = veiculo.lembrete_manutencao;
    if (!lembrete) continue;

    const dataVencida = lembrete.proxima_data <= agora;
    const kmRestante = lembrete.proximo_km - veiculo.quilometragem_atual;
    const kmVencido = kmRestante <= 0;
    const vencida = dataVencida || kmVencido;

    const dataProxima = !dataVencida && lembrete.proxima_data <= limiteData;
    const kmProximo = !kmVencido && kmRestante <= KM_AVISO_REVISAO;

    if (!vencida && !dataProxima && !kmProximo) continue;

    const motivos: string[] = [];
    if (vencida) {
      if (dataVencida) {
        motivos.push(`prevista para ${formatarData(lembrete.proxima_data)}`);
      }
      if (kmVencido) {
        motivos.push(
          `km atual ${formatarKm(veiculo.quilometragem_atual)} (previsto ${formatarKm(lembrete.proximo_km)})`,
        );
      }
    } else {
      if (dataProxima) {
        const dias = Math.ceil(
          (lembrete.proxima_data.getTime() - agora.getTime()) / UM_DIA_MS,
        );
        motivos.push(
          `vence em ${dias} ${dias === 1 ? "dia" : "dias"} (${formatarData(lembrete.proxima_data)})`,
        );
      }
      if (kmProximo) {
        motivos.push(
          `faltam ${formatarKm(kmRestante)} (previsto ${formatarKm(lembrete.proximo_km)})`,
        );
      }
    }

    const nomeVeiculo = `${veiculo.marca} ${veiculo.modelo} (${veiculo.placa})`;

    const notificacao: Notificacao = {
      id: `revisao-${veiculo.id}`,
      tipo: vencida ? "REVISAO_VENCIDA" : "REVISAO_PROXIMA",
      titulo: `${vencida ? "Revisão vencida" : "Revisão próxima"}: ${veiculo.cliente.nome}`,
      descricao: `${nomeVeiculo}, ${motivos.join(" e ")}`,
      link: `/clientes/${veiculo.cliente.id}`,
      revisao: {
        cliente_nome: veiculo.cliente.nome,
        telefone: veiculo.cliente.telefone,
        veiculo: `${veiculo.marca} ${veiculo.modelo}`,
        proxima_data: lembrete.proxima_data.toISOString(),
        proximo_km: lembrete.proximo_km,
        quilometragem_atual: veiculo.quilometragem_atual,
        vencida,
      },
    };

    (vencida ? vencidas : proximas).push({
      data: lembrete.proxima_data,
      notificacao,
    });
  }

  const porData = (a: { data: Date }, b: { data: Date }) =>
    a.data.getTime() - b.data.getTime();

  return [
    ...vencidas.sort(porData).map((v) => v.notificacao),
    ...proximas.sort(porData).map((v) => v.notificacao),
  ];
}

// ---------- Pagamentos atrasados (só proprietário) ----------
// OS finalizada com saldo em aberto há mais de 15 dias. O saldo usa a mesma
// conta de Contas a receber (calcularPagamento), para os valores baterem.
async function notificacoesDePagamento(agora: Date): Promise<Notificacao[]> {
  const limite = new Date(agora.getTime() - DIAS_PAGAMENTO_ATRASADO * UM_DIA_MS);

  const ordens = await prisma.serviceOrder.findMany({
    where: { status: "FINALIZADA", finalizada_em: { lt: limite } },
    select: {
      id: true,
      status: true,
      valor_total: true,
      finalizada_em: true,
      cliente: { select: { id: true, nome: true } },
      financialEntries: pagamentosAtivos,
    },
    orderBy: { finalizada_em: "asc" },
  });

  return ordens
    .map(comPagamento)
    .filter((ordem) => ordem.saldo.gt(0) && ordem.finalizada_em !== null)
    .map((ordem) => {
      const dias = Math.floor(
        (agora.getTime() - (ordem.finalizada_em as Date).getTime()) /
          UM_DIA_MS,
      );

      return {
        id: `pagamento-${ordem.id}`,
        tipo: "PAGAMENTO_ATRASADO" as const,
        titulo: `Pagamento atrasado: ${ordem.cliente.nome}`,
        descricao: `OS #${ordem.id}, saldo de ${formatarMoeda(ordem.saldo.toNumber())} em aberto há ${dias} dias`,
        link: `/ordens-servico/${ordem.id}`,
      };
    });
}

// ---------- Estoque abaixo do mínimo ----------
// Mesma regra do alerta do Estoque: quantidade <= quantidade_minima.
// Item arquivado não entra.
async function notificacoesDeEstoque(): Promise<Notificacao[]> {
  const itens = await prisma.stockItem.findMany({
    where: { ativo: true },
    select: { id: true, nome: true, quantidade: true, quantidade_minima: true },
    orderBy: { nome: "asc" },
  });

  return itens
    .filter((item) => item.quantidade <= item.quantidade_minima)
    .sort((a, b) => a.quantidade - b.quantidade)
    .map((item) => ({
      id: `estoque-${item.id}`,
      tipo: "ESTOQUE_BAIXO" as const,
      titulo: `Estoque baixo: ${item.nome}`,
      descricao:
        item.quantidade === 0
          ? `Sem estoque (mínimo ${item.quantidade_minima})`
          : `${item.quantidade} un. em estoque (mínimo ${item.quantidade_minima})`,
      link: "/estoque",
    }));
}

interface OpcoesNotificacoes {
  perfil?: "PROPRIETARIO" | "FUNCIONARIO";
}

export async function listarNotificacoes({ perfil }: OpcoesNotificacoes = {}) {
  const agora = new Date();

  // Pagamentos atrasados são financeiros: só o proprietário recebe
  const [revisoes, pagamentos, estoque] = await Promise.all([
    notificacoesDeRevisao(agora),
    perfil === "PROPRIETARIO" ? notificacoesDePagamento(agora) : [],
    notificacoesDeEstoque(),
  ]);

  const notificacoes = [...revisoes, ...pagamentos, ...estoque];

  return { total: notificacoes.length, notificacoes };
}