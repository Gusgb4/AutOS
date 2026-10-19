import { api } from "./api";

export type TipoNotificacao =
  | "REVISAO_VENCIDA"
  | "REVISAO_PROXIMA"
  | "ESTOQUE_BAIXO";

export interface Notificacao {
  id: string;
  tipo: TipoNotificacao;
  titulo: string;
  descricao: string;
  link: string;
  // Só nas revisões, para o botão de WhatsApp
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

export interface ListaNotificacoes {
  total: number;
  notificacoes: Notificacao[];
}

export async function listNotificacoes(): Promise<ListaNotificacoes> {
  const { data } = await api.get<ListaNotificacoes>("/notificacoes");
  return data;
}