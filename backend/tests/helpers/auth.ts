import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import type { Perfil } from "@prisma/client";
import { prisma } from "../../src/config/prisma";

export const SENHA_PADRAO = "senha123";

let contador = 0;

interface OpcoesUsuario {
  senha?: string;
  ativo?: boolean;
}

// Mesmo formato de token que o login gera
export function gerarToken(
  usuario: { id: number; perfil: Perfil },
  expiresIn: jwt.SignOptions["expiresIn"] = "1h",
) {
  return jwt.sign(
    { id: usuario.id, perfil: usuario.perfil },
    process.env.JWT_SECRET as string,
    { expiresIn },
  );
}

// Cria o usuário direto no banco e já devolve o token dele
export async function criarUsuario(perfil: Perfil, opcoes: OpcoesUsuario = {}) {
  contador += 1;
  const senha = opcoes.senha ?? SENHA_PADRAO;

  const usuario = await prisma.user.create({
    data: {
      nome: `${perfil === "PROPRIETARIO" ? "Dono" : "Funcionário"} ${contador}`,
      email: `${perfil.toLowerCase()}${contador}@teste.com`,
      senha: await bcrypt.hash(senha, 8),
      perfil,
      ativo: opcoes.ativo ?? true,
    },
  });

  return { usuario, senha, token: gerarToken(usuario) };
}

export const criarProprietario = (opcoes?: OpcoesUsuario) =>
  criarUsuario("PROPRIETARIO", opcoes);

export const criarFuncionario = (opcoes?: OpcoesUsuario) =>
  criarUsuario("FUNCIONARIO", opcoes);
