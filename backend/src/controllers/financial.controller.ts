import { FormaPagamento } from "@prisma/client";
import { Request, Response } from "express";
import { z } from "zod";
import * as financialService from "../services/financial.service";
import { AppError } from "../utils/AppError";

const dataSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida (use AAAA-MM-DD).");

const tipoSchema = z.enum(["RECEITA", "DESPESA"], {
  message: "Tipo deve ser RECEITA ou DESPESA.",
});

const categoriaSchema = z.enum(
  ["ALUGUEL", "SALARIO", "PECAS", "ENERGIA", "OUTROS"],
  { message: "Categoria inválida." },
);

const formaSchema = z.enum(FormaPagamento, {
  message: "Forma de pagamento inválida.",
});

const listSchema = z.object({
  tipo: tipoSchema.optional(),
  categoria: categoriaSchema.optional(),
  forma: formaSchema.optional(),
  inicio: dataSchema.optional(),
  fim: dataSchema.optional(),
  // Vem como texto na URL: ?estornados=true
  estornados: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
});

// GET /api/financial?tipo=&categoria=&forma=&inicio=&fim=&estornados=true
export async function list(req: Request, res: Response) {
  const filtros = listSchema.safeParse(req.query);
  if (!filtros.success) {
    return res.status(400).json({ erro: filtros.error.issues[0].message });
  }

  try {
    return res.json(await financialService.listEntries(filtros.data));
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao buscar lançamentos." });
  }
}

const createSchema = z
  .object({
    tipo: tipoSchema,
    descricao: z
      .string({ message: "Descrição é obrigatória." })
      .trim()
      .min(3, "A descrição deve ter pelo menos 3 caracteres."),
    valor: z
      .number({ message: "Valor deve ser um número." })
      .positive("O valor deve ser maior que zero."),
    data: dataSchema.optional(),
    categoria: categoriaSchema.optional(),
  })
  .refine((d) => d.tipo !== "DESPESA" || d.categoria !== undefined, {
    message: "Informe a categoria da despesa.",
  });

// POST /api/financial (lançamento manual)
export async function create(req: Request, res: Response) {
  const dados = createSchema.safeParse(req.body);
  if (!dados.success) {
    return res.status(400).json({ erro: dados.error.issues[0].message });
  }

  try {
    const lancamento = await financialService.createEntry(dados.data);
    return res.status(201).json(lancamento);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao criar lançamento." });
  }
}

// PATCH /api/financial/:id/estornar (só lançamento manual)
export async function estornar(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    return res.json(await financialService.estornarLancamento(id));
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ erro: error.message });
    }
    return res.status(500).json({ erro: "Erro ao estornar o lançamento." });
  }
}

export async function aReceber(_req: Request, res: Response) {
  try {
    return res.json(await financialService.contasAReceber());
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao buscar contas a receber." });
  }
}

const resumoSchema = z
  .object({
    inicio: dataSchema.optional(),
    fim: dataSchema.optional(),
    // Período de comparação escolhido; sem ele, usa o anterior
    comparar_inicio: dataSchema.optional(),
    comparar_fim: dataSchema.optional(),
  })
  .refine((d) => Boolean(d.inicio) === Boolean(d.fim), {
    message: "Informe a data inicial e a final, ou nenhuma das duas.",
  })
  .refine((d) => !d.inicio || !d.fim || d.inicio <= d.fim, {
    message: "A data inicial não pode ser maior que a final.",
  })
  .refine((d) => Boolean(d.comparar_inicio) === Boolean(d.comparar_fim), {
    message: "Informe o início e o fim do período de comparação.",
  })
  .refine(
    (d) => !d.comparar_inicio || !d.comparar_fim || d.comparar_inicio <= d.comparar_fim,
    { message: "Na comparação, a data inicial não pode ser maior que a final." },
  );

// GET /api/financial/resumo?inicio=2026-10-01&fim=2026-10-31[&comparar_inicio=&comparar_fim=]
export async function resumo(req: Request, res: Response) {
  const filtros = resumoSchema.safeParse(req.query);
  if (!filtros.success) {
    return res.status(400).json({ erro: filtros.error.issues[0].message });
  }

  try {
    const { inicio, fim, comparar_inicio, comparar_fim } = filtros.data;
    return res.json(
      await financialService.resumoComparativo(
        inicio,
        fim,
        comparar_inicio,
        comparar_fim,
      ),
    );
  } catch (error) {
    return res
      .status(500)
      .json({ erro: "Erro ao calcular o resumo financeiro." });
  }
}
