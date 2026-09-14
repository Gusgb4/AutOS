import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const financialSchema = z.object({
  tipo: z.enum(["RECEITA", "DESPESA"]),
  descricao: z.string().min(3, "Descrição deve ter pelo menos 3 caracteres"),
  valor: z.number().positive("O valor deve ser maior que zero"),
  data: z.string().optional().transform((val) => (val ? new Date(val) : new Date())),
  ordemId: z.number().int().optional().nullable(),
});

export async function listFinancialEntriesController(_req: Request, res: Response) {
  const entries = await prisma.financialEntry.findMany({
    include: {
      ordemServico: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return res.status(200).json(entries);
}

export async function createFinancialEntryController(req: Request, res: Response) {
  const data = financialSchema.parse(req.body);

  const entry = await prisma.financialEntry.create({
    data: {
      tipo: data.tipo,
      descricao: data.descricao,
      valor: data.valor,
      data: data.data,
      ordemId: data.ordemId,
    },
  });

  return res.status(201).json(entry);
}