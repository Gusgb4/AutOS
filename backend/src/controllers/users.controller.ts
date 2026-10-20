import { Request, Response } from "express";

import { z } from "zod";
import {
  activate,
  createUser,
  deactivate,
  listGroupedByPerfil,
  produtividade,
  resetUserPassword,
} from "../services/users.service";
import { parseMes } from "../services/reports.service";
import { AppError } from "../utils/AppError";


const produtividadeSchema = z.object({
  mes: z
    .string({ error: "Informe o mês no formato AAAA-MM." })
    .regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Use o formato AAAA-MM."),
});

// GET /api/users
export async function listController(_req: Request, res: Response) {
  const usuarios = await listGroupedByPerfil();
  return res.status(200).json(usuarios);
}

// POST /api/users
export async function createController(req: Request, res: Response) {
  const { nome, email, perfil } = req.body;
  const resultado = await createUser({ nome, email, perfil });
  return res.status(201).json(resultado);
}

// PATCH /api/users/:id/redefinir-senha
export async function resetPasswordController(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError("Não autenticado.", 401);
  }

  const id = Number(req.params.id);
  const resultado = await resetUserPassword(id, req.user.id);
  return res.status(200).json(resultado);
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

export async function produtividadeController(req: Request, res: Response) {
  const { mes } = produtividadeSchema.parse(req.query);
  return res.status(200).json(await produtividade(parseMes(mes)));
}
