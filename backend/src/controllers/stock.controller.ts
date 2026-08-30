import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";

const prisma = new PrismaClient();

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
  valor_unitario: z.number().positive("Valor unitário deve ser maior que zero"),
});

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
        orderBy: { nome: "asc" },
      });

      const formattedItems = items.map((item) => ({
        ...item,
        alerta_minimo: item.quantidade <= item.quantidade_minima,
      }));

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
      });

      if (!item) {
        return res
          .status(404)
          .json({ error: "Item de estoque não encontrado" });
      }

      return res.json({
        ...item,
        alerta_minimo: item.quantidade <= item.quantidade_minima,
      });
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
