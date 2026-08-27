import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export function ensureAuthenticated(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'Token de autenticação não fornecido' });
  }

  const [, token] = authHeader.split(' ');

  try {
    const secret = process.env.JWT_SECRET || 'chave_secreta_padrao_oficina_123';
    const decoded = jwt.verify(token, secret) as TokenPayload;

    req.user = {
      id: decoded.id,
      perfil: decoded.perfil,
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