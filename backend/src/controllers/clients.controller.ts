import { Request, Response } from "express";
import { z } from "zod";
import {
  archive,
  unarchive,
  create,
  findById,
  search,
  update,
} from "../services/clients.service";

const listClientsSchema = z.object({
  busca: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  arquivados: z
    .enum(["true", "false"], { message: "arquivados deve ser true ou false." })
    .optional()
    .transform((v) => v === "true"),
});

// GET /api/clients?busca=termo&arquivados=true
// Por padrão só clientes ativos; com arquivados=true, só os arquivados
export async function listController(req: Request, res: Response) {
  const { busca, arquivados } = listClientsSchema.parse(req.query);
  const clientes = await search({ termo: busca, arquivados });
  return res.status(200).json(clientes);
}

const createClientSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório."),
  telefone: z.string().min(1, "Telefone é obrigatório."),
  documento: z.string().min(1, "Documento é obrigatório.").optional(),
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  endereco: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
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
  email: z
    .string()
    .trim()
    .email("E-mail inválido.")
    .optional()
    .or(z.literal(""))
    .transform((v) => (v === "" ? undefined : v)),
  endereco: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

// PUT /api/clients/:id
export async function updateController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const dados = updateClientSchema.parse(req.body);
  const cliente = await update(id, dados);
  return res.status(200).json(cliente);
}

// PATCH /api/clients/:id/archive
export async function archiveController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cliente = await archive(id);
  return res.status(200).json(cliente);
}

// PATCH /api/clients/:id/unarchive
export async function unarchiveController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const cliente = await unarchive(id);
  return res.status(200).json(cliente);
}