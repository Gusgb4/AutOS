import { Request, Response } from "express";
import { TipoLancamento } from "@prisma/client";
import { z } from "zod";
import {
  searchEntries,
  findEntryById,
  createManualEntry,
  updateManualEntry,
  deleteManualEntry,
} from "../services/finance.service";

const tipoSchema = z.enum(TipoLancamento);

const listEntriesQuerySchema = z.object({
  tipo: tipoSchema.optional(),
  inicio: z.coerce.date().optional(),
  fim: z.coerce.date().optional(),
  incluir_estornados: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

export async function listEntriesController(req: Request, res: Response) {
  const filtros = listEntriesQuerySchema.parse(req.query);
  const lancamentos = await searchEntries(filtros);
  return res.status(200).json(lancamentos);
}

export async function getEntryByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const lancamento = await findEntryById(id);

  if (!lancamento) {
    return res
      .status(404)
      .json({ erro: "Lançamento financeiro não encontrado." });
  }

  return res.status(200).json(lancamento);
}

const createEntrySchema = z.object({
  tipo: tipoSchema,
  descricao: z.string().trim().min(1, "Descrição é obrigatória."),
  valor: z.number().positive("Valor deve ser maior que zero."),
  data: z.coerce.date().optional(),
});

export async function createEntryController(req: Request, res: Response) {
  const dados = createEntrySchema.parse(req.body);
  const lancamento = await createManualEntry(dados);
  return res.status(201).json(lancamento);
}

const updateEntrySchema = createEntrySchema.partial();

export async function updateEntryController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const dados = updateEntrySchema.parse(req.body);
  const lancamento = await updateManualEntry(id, dados);
  return res.status(200).json(lancamento);
}

export async function deleteEntryController(req: Request, res: Response) {
  const id = Number(req.params.id);
  await deleteManualEntry(id);
  return res.status(204).send();
}
