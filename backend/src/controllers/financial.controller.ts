import { Request, Response } from "express";
import { z } from "zod";
import { listEntries, createManualEntry } from "../services/financial.service";

const tipoSchema = z.enum(["RECEITA", "DESPESA"]);

const listQuerySchema = z.object({
  tipo: tipoSchema.optional(),
  inicio: z.coerce.date().optional(),
  fim: z.coerce.date().optional(),
});

export async function listFinancialEntriesController(
  req: Request,
  res: Response,
) {
  const filtros = listQuerySchema.parse(req.query);
  const lancamentos = await listEntries(filtros);
  return res.status(200).json(lancamentos);
}

const createEntrySchema = z.object({
  tipo: tipoSchema,
  descricao: z
    .string()
    .trim()
    .min(3, "Descrição deve ter pelo menos 3 caracteres."),
  valor: z.number().positive("O valor deve ser maior que zero."),
  data: z.coerce.date().optional(),
});

export async function createFinancialEntryController(
  req: Request,
  res: Response,
) {
  const dados = createEntrySchema.parse(req.body);
  const lancamento = await createManualEntry(dados);
  return res.status(201).json(lancamento);
}
