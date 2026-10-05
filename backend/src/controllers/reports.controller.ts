import { Request, Response } from "express";
import { z } from "zod";
import {
  parsePeriodo,
  vendasPorPeriodo,
  statusInventario,
  resumoFinanceiro,
  atividadeClientes,
} from "../services/reports.service";

const dataIso = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use o formato AAAA-MM-DD.")
  .refine(
    (v) => !Number.isNaN(new Date(`${v}T00:00:00-03:00`).getTime()),
    "Data inválida.",
  );

const periodoSchema = z
  .object({ inicio: dataIso, fim: dataIso })
  .refine((d) => d.inicio <= d.fim, {
    message: "A data inicial não pode ser maior que a final.",
    path: ["inicio"],
  });

function lerPeriodo(req: Request) {
  const { inicio, fim } = periodoSchema.parse(req.query);
  return parsePeriodo(inicio, fim);
}

// GET /api/reports/sales?inicio=AAAA-MM-DD&fim=AAAA-MM-DD
export async function vendasController(req: Request, res: Response) {
  return res.status(200).json(await vendasPorPeriodo(lerPeriodo(req)));
}

// GET /api/reports/inventory
export async function inventarioController(_req: Request, res: Response) {
  return res.status(200).json(await statusInventario());
}

// GET /api/reports/financial-summary?inicio=...&fim=...
export async function resumoController(req: Request, res: Response) {
  return res.status(200).json(await resumoFinanceiro(lerPeriodo(req)));
}

// GET /api/reports/client-activity?inicio=...&fim=...
export async function atividadeController(req: Request, res: Response) {
  return res.status(200).json(await atividadeClientes(lerPeriodo(req)));
}