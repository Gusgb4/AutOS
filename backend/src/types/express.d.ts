import { Perfil } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        perfil: Perfil;
      };
    }
  }
}

export {};