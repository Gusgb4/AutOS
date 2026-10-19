import { Request, Response } from "express";
import { listarNotificacoes } from "../services/notificacoes.service";

// GET /api/notificacoes
export async function listController(req: Request, res: Response) {
  return res
    .status(200)
    .json(await listarNotificacoes({ perfil: req.user?.perfil }));
}