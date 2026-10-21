import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/prisma';
import { env } from '../config/env';
import {
  limparAcessosAntigos,
  registrarAcesso,
} from '../services/accessLog.service';

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

const changePasswordSchema = z.object({
  senha_atual: z.string().min(1, 'A senha atual é obrigatória'),
  nova_senha: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
});

export class AuthController {
  // POST /api/auth/login
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || !user.ativo) {
        await registrarAcesso(req, {
          evento: 'LOGIN_FALHA',
          email,
          usuarioId: user?.id,
        });
        return res.status(400).json({ error: 'E-mail ou senha incorretos' });
      }

      const passwordMatch = await bcrypt.compare(senha, user.senha);
      if (!passwordMatch) {
        await registrarAcesso(req, {
          evento: 'LOGIN_FALHA',
          email,
          usuarioId: user.id,
        });
        return res.status(400).json({ error: 'E-mail ou senha incorretos' });
      }

      await registrarAcesso(req, {
        evento: 'LOGIN_OK',
        email,
        usuarioId: user.id,
      });
      await limparAcessosAntigos();

      const token = jwt.sign(
        { id: user.id, perfil: user.perfil },
        env.jwtSecret,
        { expiresIn: env.jwtExpiresIn as SignOptions['expiresIn'] }
      );

      return res.json({
        token,
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          perfil: user.perfil,
          ativo: user.ativo,
          trocar_senha: user.trocar_senha,
        },
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      return res.status(500).json({ error: 'Erro ao realizar login' });
    }
  }

  // GET /api/auth/me
  async me(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          ativo: true,
          trocar_senha: true,
        },
      });

      if (!user) {
        return res.status(401).json({ error: 'Usuário não encontrado' });
      }

      return res.json(user);
    } catch {
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }

  // PATCH /api/auth/senha
  async changePassword(req: Request, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Não autenticado' });

      const { senha_atual, nova_senha } = changePasswordSchema.parse(req.body);

      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
      });

      if (!user) {
        return res.status(404).json({ error: 'Usuário não encontrado' });
      }

      const passwordMatch = await bcrypt.compare(senha_atual, user.senha);
      if (!passwordMatch) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      const hashedPassword = await bcrypt.hash(nova_senha, 10);

      await prisma.user.update({
        where: { id: user.id },
        data: {
          senha: hashedPassword,
          trocar_senha: false,
        },
      });

      return res.json({ message: 'Senha alterada com sucesso!' });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: error.issues[0]?.message || 'Dados inválidos',
          errors: error.issues,
        });
      }
      return res.status(500).json({ error: 'Erro interno ao alterar a senha' });
    }
  }
}