import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma';
import { env } from '../config/env';

interface TokenPayload {
  id: number;
  perfil: 'PROPRIETARIO' | 'FUNCIONARIO';
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        perfil: 'PROPRIETARIO' | 'FUNCIONARIO';
      };
    }
  }
}

export async function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as TokenPayload;

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, perfil: true, ativo: true, trocar_senha: true },
    });

    if (!user || !user.ativo) {
      return res.status(401).json({ error: 'Usuário não encontrado ou desativado' });
    }

    const isAllowedRoute =
      req.originalUrl.includes('/auth/senha') || req.originalUrl.includes('/auth/me');

    if (user.trocar_senha && !isAllowedRoute) {
      return res.status(403).json({
        error: 'É necessário alterar a senha provisória antes de continuar.',
        codigo: 'TROCAR_SENHA',
      });
    }

    req.user = {
      id: user.id,
      perfil: user.perfil,
    };

    return next();
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
}

export function requireRole(allowedRoles: ('PROPRIETARIO' | 'FUNCIONARIO')[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !allowedRoles.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Acesso não autorizado para o seu perfil' });
    }
    return next();
  };
}