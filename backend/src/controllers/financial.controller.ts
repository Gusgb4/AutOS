import { Request, Response } from "express";
import { z } from "zod";
import * as financialService from "../services/financial.service";

export async function list(req: Request, res: Response) {
  try {
    const filtros = {
      tipo: req.query.tipo as string,
      inicio: req.query.inicio as string,
      fim: req.query.fim as string,
    };
    const lancamentos = await financialService.listEntries(filtros);
    return res.json(lancamentos);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao buscar lançamentos." });
  }
}

export async function create(req: Request, res: Response) {
  try {
    const { tipo, descricao, valor, data } = req.body;

    if (!tipo || !descricao || valor === undefined) {
      return res
        .status(400)
        .json({ erro: "Preencha todos os campos obrigatórios." });
    }

    const lancamento = await financialService.createEntry({
      tipo,
      descricao,
      valor,
      data,
    });
    return res.status(201).json(lancamento);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao criar lançamento." });
  }
}

export async function aReceber(_req: Request, res: Response) {
  try {
    return res.json(await financialService.contasAReceber());
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao buscar contas a receber." });
  }
}

const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD).");

const resumoSchema = z
  .object({ inicio: dataSchema.optional(), fim: dataSchema.optional() })
  .refine((d) => Boolean(d.inicio) === Boolean(d.fim), {
    message: "Informe a data inicial e a final, ou nenhuma das duas.",
  });

// GET /api/financial/resumo?inicio=2026-10-01&fim=2026-10-31
export async function resumo(req: Request, res: Response) {
  const filtros = resumoSchema.safeParse(req.query);
  if (!filtros.success) {
    return res.status(400).json({ erro: filtros.error.issues[0].message });
  }

  try {
    const { inicio, fim } = filtros.data;
    return res.json(await financialService.resumoComparativo(inicio, fim));
  } catch (error) {
    return res
      .status(500)
      .json({ erro: "Erro ao calcular o resumo financeiro." });
  }
}
