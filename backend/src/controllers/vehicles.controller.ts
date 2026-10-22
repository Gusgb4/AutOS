import { Request, Response } from "express";
import { z } from "zod";
import {
  search,
  findById,
  create,
  update,
  archive,
  unarchive,
} from "../services/vehicles.service";

// GET /api/vehicles?placa=termo
export async function listController(req: Request, res: Response) {
  const termo =
    typeof req.query.placa === "string" ? req.query.placa : undefined;
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

// Um lembrete: nome livre e os dois intervalos (vence pelo que chegar primeiro)
const lembreteSchema = z.object({
  id: z.number().int().positive().optional(),
  nome: z
    .string({ message: "Dê um nome ao lembrete." })
    .trim()
    .min(1, "Dê um nome ao lembrete.")
    .max(60, "O nome do lembrete pode ter até 60 caracteres."),
  intervalo_dias: z
    .number({ message: "Informe o intervalo em dias." })
    .int()
    .positive("O intervalo em dias deve ser maior que zero."),
  intervalo_km: z
    .number({ message: "Informe o intervalo em km." })
    .int()
    .positive("O intervalo em km deve ser maior que zero."),
});

const lembretesSchema = z
  .array(lembreteSchema)
  .max(10, "Cada veículo pode ter até 10 lembretes.")
  .optional();

// Placa sempre maiúscula e sem espaços nas pontas: "arx2020" e "ARX2020"
// são o mesmo carro
const placaSchema = z
  .string({ message: "Placa é obrigatória." })
  .trim()
  .min(1, "Placa é obrigatória.")
  .transform((v) => v.toUpperCase());

// Opcional; vazio apaga
const corSchema = z
  .string()
  .trim()
  .nullable()
  .optional()
  .transform((v) => (v === "" ? null : v));

const createVehicleSchema = z.object({
  cliente_id: z.number().int().positive(),
  placa: placaSchema,
  cor: corSchema,
  marca: z.string().min(1, "Marca é obrigatória."),
  modelo: z.string().min(1, "Modelo é obrigatório."),
  ano: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  quilometragem_atual: z.number().int().nonnegative().optional(),
  lembretes: lembretesSchema,
});

const updateVehicleSchema = z.object({
  cliente_id: z.number().int().positive().optional(),
  placa: placaSchema.optional(),
  cor: corSchema,
  marca: z.string().min(1).optional(),
  modelo: z.string().min(1).optional(),
  ano: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1)
    .optional(),
  quilometragem_atual: z.number().int().nonnegative().optional(),
  lembretes: lembretesSchema,
});

// POST /api/vehicles
export async function createController(req: Request, res: Response) {
  const dados = createVehicleSchema.parse(req.body);
  const veiculo = await create(dados);
  return res.status(201).json(veiculo);
}

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
