import type { ServiceOrder } from "../services/serviceOrders";

function formatCurrency(value: string | number) {
  return Number(value)
    .toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
    .replace(/\u00A0/g, " ");
}

// Monta o link wa.me: só dígitos e, sem DDI, assume Brasil (55)
export function montarLinkWhatsApp(telefone: string, mensagem: string) {
  const digits = (telefone || "").replace(/\D/g, "");
  const comDDI = digits.length > 11 ? digits : `55${digits}`;

  return `https://wa.me/${comDDI}?text=${encodeURIComponent(mensagem)}`;
}

// Orçamento da OS: mensagem curta, no formato que a oficina já manda.
// A resposta do cliente fica como a autorização do serviço.
// Depois de finalizada, vira o aviso de que o carro está pronto.
export function buildWhatsAppLink(order: ServiceOrder) {
  const linhasServicos = order.servicos
    .map((s) => `${s.descricao}: ${formatCurrency(s.valor)}`)
    .join("\n");

  const linhasPecas = order.pecas
    .map(
      (p) =>
        `${p.item_estoque.nome} (x${p.quantidade}): ${formatCurrency(Number(p.valor_unitario) * p.quantidade)}`,
    )
    .join("\n");

  const finalizada = order.status === "FINALIZADA";

  const partes = [
    `Olá ${order.cliente?.nome}!`,
    `${finalizada ? "Seu veículo está pronto!" : "Segue o orçamento:"}\nVeículo: *${order.veiculo?.marca} ${order.veiculo?.modelo}*`,
    `*Serviços:*\n${linhasServicos || "Nenhum serviço."}`,
    `*Peças:*\n${linhasPecas || "Nenhuma peça."}`,
    `*Valor total: ${formatCurrency(order.valor_total)}*`,
    finalizada ? null : "Para autorizar o serviço, é só responder esta mensagem.",
  ];
  const mensagem = partes.filter(Boolean).join("\n\n");

  return montarLinkWhatsApp(order.cliente?.telefone ?? "", mensagem);
}

interface DadosRevisao {
  cliente_nome: string;
  telefone: string;
  veiculo: string;
  // Nome do lembrete: "Troca de óleo", "Correia dentada"...
  lembrete: string;
  proxima_data: string;
  proximo_km: number;
  quilometragem_atual: number;
  vencida: boolean;
}

const UM_DIA_MS = 24 * 60 * 60 * 1000;

// Lembrete de revisão (usado pelo sino de notificações)
export function buildRevisaoWhatsAppLink(revisao: DadosRevisao) {
  const dataPrevista = new Date(revisao.proxima_data);
  const data = dataPrevista.toLocaleDateString("pt-BR", {
    timeZone: "America/Sao_Paulo",
  });

  const diasRestantes = Math.ceil(
    (dataPrevista.getTime() - Date.now()) / UM_DIA_MS,
  );
  const situacaoData =
    diasRestantes <= 0
      ? "já passou"
      : diasRestantes === 1
        ? "falta 1 dia"
        : `faltam ${diasRestantes} dias`;

  const kmPrevisto = revisao.proximo_km.toLocaleString("pt-BR");
  const kmAtual = revisao.quilometragem_atual.toLocaleString("pt-BR");
  const situacao = revisao.vencida ? "já venceu" : "está chegando";

  const mensagem = `Olá ${revisao.cliente_nome}!\n\nO lembrete de *${revisao.lembrete}* do seu *${revisao.veiculo}* ${situacao}.\n\n*Previsto:*\n- Data: *${data}* (${situacaoData})\n- Quilometragem: *${kmPrevisto} km* (o veículo está com *${kmAtual} km*)\n\nVale o que chegar primeiro: a data ou a quilometragem.\n\nQuer agendar um horário?`;

  return montarLinkWhatsApp(revisao.telefone, mensagem);
}