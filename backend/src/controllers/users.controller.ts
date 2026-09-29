import { Request, Response } from "express";
import { activate, deactivate, listGroupedByPerfil } from "../services/users.service";
import { AppError } from "../utils/AppError";

// GET /api/users
export async function listController(_req: Request, res: Response) {
  const usuarios = await listGroupedByPerfil();
  return res.status(200).json(usuarios);
}

// PATCH /api/users/:id/deactivate
export async function deactivateController(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError("Não autenticado.", 401);
  }

  const id = Number(req.params.id);
  const usuario = await deactivate(id, req.user.id);
  return res.status(200).json(usuario);
}

// PATCH /api/users/:id/activate
export async function activateController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const usuario = await activate(id);
  return res.status(200).json(usuario);
}