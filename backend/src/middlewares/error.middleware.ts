import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../utils/AppError";

export function errorMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ erro: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      erro: "Dados inválidos.",
      detalhes: err.flatten().fieldErrors,
    });
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      return res.status(409).json({
        erro: "Já existe um registro com esse valor único.",
        campo: err.meta?.target,
      });
    }
    if (err.code === "P2025") {
      return res.status(404).json({ erro: "Registro não encontrado." });
    }
  }

  console.error(err);
  return res.status(500).json({ erro: "Erro interno do servidor." });
}