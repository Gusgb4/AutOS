import { Request, Response } from "express";
import { vendasPorPeriodo } from "../services/reports.service";

// GET /api/reports/sales?inicio=YYYY-MM-DD&fim=YYYY-MM-DD
export async function salesController(req: Request, res: Response) {
  const inicio = typeof req.query.inicio === "string" ? req.query.inicio : undefined;
  const fim = typeof req.query.fim === "string" ? req.query.fim : undefined;

  const relatorio = await vendasPorPeriodo({ inicio, fim });
  return res.status(200).json(relatorio);
}