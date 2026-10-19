import { Request, Response } from "express";
import { listarNotificacoes } from "../services/notificacoes.service";

// GET /api/notificacoes
export async function listController(_req: Request, res: Response) {
  return res.status(200).json(await listarNotificacoes());
}