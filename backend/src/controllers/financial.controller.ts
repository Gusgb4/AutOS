import { Request, Response } from "express";
import { CategoriaDespesa } from "@prisma/client";
import { z } from "zod";
import * as financialService from "../services/financial.service";
import { listarAReceber } from "../services/serviceOrders.service";
import { AppError } from "../utils/AppError";

const tipoSchema = z.enum(["RECEITA", "DESPESA"], {
  message: "Tipo deve ser RECEITA ou DESPESA.",
});
const categoriaSchema = z.enum(CategoriaDespesa, {
  message: "Categoria de despesa inválida.",
});
const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD).")
  .refine((d) => !Number.isNaN(new Date(d).getTime()), "Data inválida.");

// Lê a primeira mensagem do Zod para o front mostrar algo útil
function validar<T>(schema: z.ZodType<T>, dados: unknown): T {
  const resultado = schema.safeParse(dados);
  if (!resultado.success) {
    throw new AppError(resultado.error.issues[0]?.message ?? "Dados inválidos.");
  }
  return resultado.data;
}

const periodoSchema = z.object({
  inicio: dataSchema.optional(),
  fim: dataSchema.optional(),
});

const listSchema = periodoSchema.extend({
  tipo: tipoSchema.optional(),
  categoria: categoriaSchema.optional(),
  estornados: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

// GET /api/financial?tipo=DESPESA&categoria=ALUGUEL&inicio=2026-10-01&fim=2026-10-31&estornados=true
export async function list(req: Request, res: Response) {
  const filtros = validar(listSchema, req.query);
  const lancamentos = await financialService.listEntries(filtros);
  return res.json(lancamentos);
}

// GET /api/financial/despesas-por-categoria?inicio=2026-10-01&fim=2026-10-31
export async function expensesByCategory(req: Request, res: Response) {
  const periodo = validar(periodoSchema, req.query);
  const resumo = await financialService.despesasPorCategoria(periodo);
  return res.json(resumo);
}

// Os dois juntos ou nenhum (aí vale o mês atual contra o anterior)
const resumoSchema = z
  .object({ inicio: dataSchema.optional(), fim: dataSchema.optional() })
  .refine((d) => Boolean(d.inicio) === Boolean(d.fim), {
    message: "Informe a data inicial e a final, ou nenhuma das duas.",
  })
  .refine((d) => !d.inicio || !d.fim || d.inicio <= d.fim, {
    message: "A data inicial não pode ser maior que a final.",
  });

// GET /api/financial/resumo?inicio=2026-10-01&fim=2026-10-31
export async function summary(req: Request, res: Response) {
  const { inicio, fim } = validar(resumoSchema, req.query);
  const resumo = await financialService.resumoComparativo(
    inicio && fim ? { inicio, fim } : undefined,
  );
  return res.json(resumo);
}

// GET /api/financial/a-receber
export async function receivables(_req: Request, res: Response) {
  const aReceber = await listarAReceber();
  return res.json(aReceber);
}

const createSchema = z
  .object({
    tipo: tipoSchema,
    descricao: z
      .string({ message: "Descrição é obrigatória." })
      .trim()
      .min(3, "Descrição deve ter pelo menos 3 caracteres."),
    valor: z
      .number({ message: "Valor deve ser um número." })
      .positive("O valor deve ser maior que zero."),
    data: dataSchema.optional(),
    categoria: categoriaSchema.optional(),
  })
  .refine((d) => d.tipo !== "DESPESA" || d.categoria !== undefined, {
    message: "Informe a categoria da despesa.",
    path: ["categoria"],
  });

// POST /api/financial
export async function create(req: Request, res: Response) {
  const dados = validar(createSchema, req.body);
  const lancamento = await financialService.createEntry(dados);
  return res.status(201).json(lancamento);
}
