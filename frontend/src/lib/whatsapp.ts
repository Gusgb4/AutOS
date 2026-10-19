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

// Orçamento da OS
export function buildWhatsAppLink(order: ServiceOrder) {
  const linhasServicos = order.servicos
    .map((s) => `- ${s.descricao}: ${formatCurrency(s.valor)}`)
    .join("\n");

  const linhasPecas = order.pecas
    .map(
      (p) =>
        `- ${p.item_estoque.nome} (x${p.quantidade}): ${formatCurrency(Number(p.valor_unitario) * p.quantidade)}`,
    )
    .join("\n");

  const mensagem = `Olá ${order.cliente?.nome}!\n\nSegue o orçamento da sua *OS #${order.id}*.\nVeículo: *${order.veiculo?.marca} ${order.veiculo?.modelo}*.\n\n*Serviços:*\n${linhasServicos || "Nenhum serviço."}\n\n*Peças:*\n${linhasPecas || "Nenhuma peça."}\n\n*Valor total: ${formatCurrency(order.valor_total)}*`;

  return montarLinkWhatsApp(order.cliente?.telefone ?? "", mensagem);
}

interface DadosRevisao {
  cliente_nome: string;
  telefone: string;
  veiculo: string;
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

  const mensagem = `Olá ${revisao.cliente_nome}!\n\nA revisão do seu *${revisao.veiculo}* ${situacao}.\n\n*Previsto para a revisão:*\n- Data: *${data}* (${situacaoData})\n- Quilometragem: *${kmPrevisto} km* (o veículo está com *${kmAtual} km*)\n\nA revisão vale pelo que chegar primeiro: a data ou a quilometragem.\n\nQuer agendar um horário?`;

  return montarLinkWhatsApp(revisao.telefone, mensagem);
}