import { Request, Response } from "express";
import { Prisma, PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

const NOVENTA_DIAS_MS = 90 * 24 * 60 * 60 * 1000;

const stockItemSchema = z.object({
  nome: z.string().min(1, "Nome do item é obrigatório"),
  categoria: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  fornecedor: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
  quantidade: z.number().int().nonnegative("Quantidade não pode ser negativa"),
  quantidade_minima: z
    .number()
    .int()
    .nonnegative("Quantidade mínima não pode ser negativa"),
  valor_final: z.number().positive("Preço de venda deve ser maior que zero"),
  // null permite apagar o preço de custo ao editar
  valor_entrada: z
    .number()
    .nonnegative("Preço de custo não pode ser negativo")
    .nullable()
    .optional(),
});

// Último uso em OS não cancelada. ServiceOrderPart não tem data própria,
// então a referência é a data de abertura da OS.
const ultimoUsoInclude = {
  usos_em_ordens: {
    where: { ordem: { status: { not: "CANCELADA" } } },
    select: { ordem: { select: { created_at: true } } },
    orderBy: { ordem: { created_at: "desc" } },
    take: 1,
  },
} satisfies Prisma.StockItemInclude;

type StockItemComUso = Prisma.StockItemGetPayload<{
  include: typeof ultimoUsoInclude;
}>;

// Parado: tem saldo e nenhum uso nos últimos 90 dias. Item nunca usado
// conta a partir do próprio cadastro. O custo só vai para o proprietário.
function formatarItem(item: StockItemComUso, exibirCusto: boolean) {
  const { usos_em_ordens, valor_entrada, ...dados } = item;
  const ultimo_uso = usos_em_ordens[0]?.ordem.created_at ?? null;
  const referencia = ultimo_uso ?? item.created_at;

  return {
    ...dados,
    ...(exibirCusto ? { valor_entrada } : {}),
    alerta_minimo: item.quantidade <= item.quantidade_minima,
    ultimo_uso,
    parado:
      item.quantidade > 0 &&
      Date.now() - referencia.getTime() > NOVENTA_DIAS_MS,
  };
}

export class StockController {
  // Criar novo item no estoque
  async create(req: Request, res: Response) {
    try {
      const data = stockItemSchema.parse(req.body);

      const item = await prisma.stockItem.create({
        data,
      });

      return res.status(201).json({
        ...item,
        alerta_minimo: item.quantidade <= item.quantidade_minima,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      return res.status(500).json({ error: "Erro ao criar item de estoque" });
    }
  }

  // Listar itens com alerta_minimo e filtro opcional
  async list(req: Request, res: Response) {
    try {
      const { lowStockOnly } = req.query;

      const items = await prisma.stockItem.findMany({
        include: ultimoUsoInclude,
        orderBy: { nome: "asc" },
      });

      const exibirCusto = req.user?.perfil === "PROPRIETARIO";
      const formattedItems = items.map((item) =>
        formatarItem(item, exibirCusto),
      );

      if (lowStockOnly === "true") {
        const lowStockItems = formattedItems.filter(
          (item) => item.alerta_minimo,
        );
        return res.json(lowStockItems);
      }

      return res.json(formattedItems);
    } catch (error) {
      return res.status(500).json({ error: "Erro ao listar itens do estoque" });
    }
  }

  // Buscar item por ID
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const item = await prisma.stockItem.findUnique({
        where: { id: Number(id) },
        include: ultimoUsoInclude,
      });

      if (!item) {
        return res
          .status(404)
          .json({ error: "Item de estoque não encontrado" });
      }

      return res.json(formatarItem(item, req.user?.perfil === "PROPRIETARIO"));
    } catch (error) {
      return res.status(500).json({ error: "Erro ao buscar item de estoque" });
    }
  }

  //Atualizar item
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = stockItemSchema.partial().parse(req.body);

      const itemExists = await prisma.stockItem.findUnique({
        where: { id: Number(id) },
      });

      if (!itemExists) {
        return res
          .status(404)
          .json({ error: "Item de estoque não encontrado" });
      }

      const updatedItem = await prisma.stockItem.update({
        where: { id: Number(id) },
        data,
      });

      return res.json({
        ...updatedItem,
        alerta_minimo: updatedItem.quantidade <= updatedItem.quantidade_minima,
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ errors: error.issues });
      }
      return res
        .status(500)
        .json({ error: "Erro ao atualizar item de estoque" });
    }
  }

  // Deletar item
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const itemExists = await prisma.stockItem.findUnique({
        where: { id: Number(id) },
      });

      if (!itemExists) {
        return res
          .status(404)
          .json({ error: "Item de estoque não encontrado" });
      }

      const emUso = await prisma.serviceOrderPart.count({
        where: { item_estoque_id: Number(id) },
      });

      if (emUso > 0) {
        return res.status(409).json({
          error:
            "Este item já foi usado em ordens de serviço e não pode ser excluído.",
        });
      }

      await prisma.stockItem.delete({
        where: { id: Number(id) },
      });

      return res.status(204).send();
    } catch (error) {
      return res.status(500).json({ error: "Erro ao deletar item de estoque" });
    }
  }
}
