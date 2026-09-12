import { Request, Response } from "express";
import { z } from "zod";
import { search, findById, create, update, archive, unarchive } from "../services/vehicles.service";

// GET /api/vehicles?placa=termo
export async function listController(req: Request, res: Response) {
  const termo = typeof req.query.placa === "string" ? req.query.placa : undefined;
  const veiculos = await search(termo);
  return res.status(200).json(veiculos);
}

// GET /api/vehicles/:id
export async function getByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const veiculo = await findById(id);

  if (!veiculo) {
    return res.status(404).json({ erro: "Veículo não encontrado." });
  }

  return res.status(200).json(veiculo);
}

const createVehicleSchema = z.object({
  cliente_id: z.number().int().positive(),
  placa: z.string().min(1, "Placa é obrigatória."),
  marca: z.string().min(1, "Marca é obrigatória."),
  modelo: z.string().min(1, "Modelo é obrigatório."),
  ano: z.number().int().min(1900).max(new Date().getFullYear() + 1),
});

// POST /api/vehicles
export async function createController(req: Request, res: Response) {
  const dados = createVehicleSchema.parse(req.body);
  const veiculo = await create(dados);
  return res.status(201).json(veiculo);
}

const updateVehicleSchema = z.object({
  cliente_id: z.number().int().positive().optional(),
  placa: z.string().min(1).optional(),
  marca: z.string().min(1).optional(),
  modelo: z.string().min(1).optional(),
  ano: z.number().int().min(1900).max(new Date().getFullYear() + 1).optional(),
});

// PUT /api/vehicles/:id
export async function updateController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const dados = updateVehicleSchema.parse(req.body);
  const veiculo = await update(id, dados);
  return res.status(200).json(veiculo);
}

// PATCH /api/vehicles/:id/archive
export async function archiveController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const veiculo = await archive(id);
  return res.status(200).json(veiculo);
}

// PATCH /api/vehicles/:id/unarchive
export async function unarchiveController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const veiculo = await unarchive(id);
  return res.status(200).json(veiculo);
}