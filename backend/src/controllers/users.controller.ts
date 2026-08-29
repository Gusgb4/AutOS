import { Request, Response } from "express";
import { listGroupedByPerfil } from "../services/users.service";

// GET /api/users
export async function listController(_req: Request, res: Response) {
  const usuarios = await listGroupedByPerfil();
  return res.status(200).json(usuarios);
}