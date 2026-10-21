import { EventoAcesso } from "@prisma/client";
import { Request } from "express";
import { prisma } from "../config/prisma";

// Marco Civil da Internet, art. 15: registros de acesso guardados por 6 meses
export const MESES_RETENCAO = 6;

interface RegistroAcesso {
  evento: EventoAcesso;
  email: string;
  // Só quando o e-mail é de um usuário cadastrado
  usuarioId?: number;
}

// Falha ao gravar o log não pode impedir ninguém de entrar no sistema
export async function registrarAcesso(req: Request, dados: RegistroAcesso) {
  try {
    await prisma.accessLog.create({
      data: {
        evento: dados.evento,
        email: dados.email,
        usuario_id: dados.usuarioId ?? null,
        // Com o "trust proxy" do app.ts, é o IP de quem acessou e não o do Render
        ip: req.ip ?? "desconhecido",
        user_agent: req.get("user-agent")?.slice(0, 500) ?? null,
      },
    });
  } catch (error) {
    console.error("Não foi possível gravar o registro de acesso.", error);
  }
}

// Apaga o que passou dos 6 meses. Roda a cada login, que é quando o sistema
// está em uso (no plano free o Render dorme, então um agendamento não é garantido).
export async function limparAcessosAntigos(agora = new Date()) {
  const limite = new Date(agora);
  limite.setMonth(limite.getMonth() - MESES_RETENCAO);

  try {
    await prisma.accessLog.deleteMany({ where: { created_at: { lt: limite } } });
  } catch (error) {
    console.error("Não foi possível limpar os registros de acesso antigos.", error);
  }
}
