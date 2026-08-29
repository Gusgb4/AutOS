import { Request, Response } from "express";
import { z } from "zod";
import { create, findById, remove, search, update } from "../services/clients.service";

//filtro de clientes
export async function listController(req: Request, res: Response) {
  const termo = typeof req.query.busca === "string" ? req.query.busca : undefined;
  const clientes = await search(termo);
  return res.status(200).json(clientes);
}

const createClientSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  telefone: z.string().min(1, "Telefone é obrigatório."),
  documento: z.string().min(1, "Documento é obrigatório."),
});

// POST /api/clients
export async function createController(req: Request, res: Response) {
  const dados = createClientSchema.parse(req.body);
  const cliente = await create(dados);
  return res.status(201).json(cliente);
}

// GET /api/clients/:id
export async function getByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cliente = await findById(id);

  if (!cliente) {
    return res.status(404).json({ erro: "Cliente não encontrado." });
  }

  return res.status(200).json(cliente);
}

const updateClientSchema = z.object({
  nome: z.string().min(1).optional(),
  telefone: z.string().min(1).optional(),
  documento: z.string().min(1).optional(),
});

// PUT /api/clients/:id
export async function updateController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const dados = updateClientSchema.parse(req.body);
  const cliente = await update(id, dados);
  return res.status(200).json(cliente);
}

// DELETE /api/clients/:id
export async function removeController(req: Request, res: Response) {
  const id = Number(req.params.id);
  await remove(id);
  return res.status(204).send();
}