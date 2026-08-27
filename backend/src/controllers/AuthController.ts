import { Request, Response } from 'express';
import { PrismaClient, Perfil } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();

const registerSchema = z.object({
  nome: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  perfil: z.nativeEnum(Perfil).default(Perfil.FUNCIONARIO),
});

const loginSchema = z.object({
  email: z.string().email('E-mail inválido'),
  senha: z.string().min(1, 'Senha é obrigatória'),
});

export class AuthController {
  // POST /api/auth/register
  async register(req: Request, res: Response) {
    try {
      const { nome, email, senha, perfil } = registerSchema.parse(req.body);

      const userExists = await prisma.user.findUnique({ where: { email } });
      if (userExists) {
        return res.status(400).json({ error: 'E-mail já cadastrado' });
      }

      const passwordHash = await bcrypt.hash(senha, 8);

      const user = await prisma.user.create({
        data: {
          nome,
          email,
          senha: passwordHash,
          perfil,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          perfil: true,
          created_at: true,
        },
      });

      return res.status(201).json(user);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      return res.status(500).json({ error: 'Erro ao registrar usuário' });
    }
  }

// POST /api/auth/login
  async login(req: Request, res: Response) {
    try {
      const { email, senha } = loginSchema.parse(req.body);

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return res.status(400).json({ error: 'E-mail ou senha incorretos' });
      }

      const passwordMatch = await bcrypt.compare(senha, user.senha);
      if (!passwordMatch) {
        return res.status(400).json({ error: 'E-mail ou senha incorretos' });
      }

      const secret = process.env.JWT_SECRET || 'chave_secreta_padrao_oficina_123';

      const token = jwt.sign(
        { id: user.id, perfil: user.perfil },
        secret,
        { expiresIn: '8h' }
      );

      return res.json({
        user: {
          id: user.id,
          nome: user.nome,
          email: user.email,
          perfil: user.perfil,
        },
        token,
      });
    } catch (error: any) {
      console.error('Erro detalhado no login:', error); // Mostra o erro exato no terminal do VS Code
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
        select: { id: true, nome: true, email: true, perfil: true },
      });

      return res.json(user);
    } catch {
      return res.status(500).json({ error: 'Erro ao buscar perfil' });
    }
  }
}