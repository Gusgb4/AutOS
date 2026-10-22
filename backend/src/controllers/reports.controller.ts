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

// Período do relatório e, opcionalmente, o período de comparação
// (sem ele, compara com o período anterior de mesma duração)
const periodoSchema = z
  .object({
    inicio: dataIso,
    fim: dataIso,
    comparar_inicio: dataIso.optional(),
    comparar_fim: dataIso.optional(),
  })
  .refine((d) => d.inicio <= d.fim, {
    message: "A data inicial não pode ser maior que a final.",
    path: ["inicio"],
  })
  .refine((d) => Boolean(d.comparar_inicio) === Boolean(d.comparar_fim), {
    message: "Informe o início e o fim do período de comparação.",
    path: ["comparar_inicio"],
  })
  .refine(
    (d) => !d.comparar_inicio || !d.comparar_fim || d.comparar_inicio <= d.comparar_fim,
    {
      message: "Na comparação, a data inicial não pode ser maior que a final.",
      path: ["comparar_inicio"],
    },
  );

function lerPeriodo(req: Request) {
  const { inicio, fim, comparar_inicio, comparar_fim } = periodoSchema.parse(
    req.query,
  );
  const comparacao =
    comparar_inicio && comparar_fim
      ? parsePeriodo(comparar_inicio, comparar_fim)
      : undefined;
  return [parsePeriodo(inicio, fim), comparacao] as const;
}

// GET /api/reports/sales?inicio=AAAA-MM-DD&fim=AAAA-MM-DD[&comparar_inicio=&comparar_fim=]
export async function vendasController(req: Request, res: Response) {
  return res.status(200).json(await vendasPorPeriodo(...lerPeriodo(req)));
}

// GET /api/reports/inventory
export async function inventarioController(req: Request, res: Response) {
  return res.status(200).json(await statusInventario(...lerPeriodo(req)));
}

// GET /api/reports/financial-summary?inicio=...&fim=...
export async function resumoController(req: Request, res: Response) {
  return res.status(200).json(await resumoFinanceiro(...lerPeriodo(req)));
}

// GET /api/reports/client-activity?inicio=...&fim=...
export async function atividadeController(req: Request, res: Response) {
  return res.status(200).json(await atividadeClientes(...lerPeriodo(req)));
}
