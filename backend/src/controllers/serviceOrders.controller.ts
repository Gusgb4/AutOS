import { Request, Response } from "express";
import { StatusOrdemServico } from "@prisma/client";
import { z } from "zod";
import {
  search,
  findById,
  create,
  addPart,
  removePart,
  addService,
  removeService,
  changeStatus,
} from "../services/serviceOrders.service";

const statusSchema = z.enum(StatusOrdemServico);

// GET /api/service-orders?status=ABERTA
export async function listController(req: Request, res: Response) {
  const status =
    typeof req.query.status === "string"
      ? statusSchema.parse(req.query.status)
      : undefined;
  const ordens = await search(status);
  return res.status(200).json(ordens);
}

// GET /api/service-orders/:id
export async function getByIdController(req: Request, res: Response) {
  const id = Number(req.params.id);
  const ordem = await findById(id);

  if (!ordem) {
    return res.status(404).json({ erro: "Ordem de serviço não encontrada." });
  }

  return res.status(200).json(ordem);
}

const createServiceOrderSchema = z.object({
  cliente_id: z.number().int().positive(),
  veiculo_id: z.number().int().positive(),
  mecanico_id: z.number().int().positive(),
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

// POST /api/service-orders
export async function createController(req: Request, res: Response) {
  const dados = createServiceOrderSchema.parse(req.body);
  const ordem = await create(dados);
  return res.status(201).json(ordem);
}

const addPartSchema = z.object({
  item_estoque_id: z.number().int().positive(),
  quantidade: z.number().int().positive("Quantidade deve ser maior que zero."),
});

// POST /api/service-orders/:id/parts
export async function addPartController(req: Request, res: Response) {
  const ordemId = Number(req.params.id);
  const dados = addPartSchema.parse(req.body);
  const resultado = await addPart(
    ordemId,
    dados.item_estoque_id,
    dados.quantidade,
  );
  return res.status(201).json(resultado);
}

// DELETE /api/service-orders/:id/parts/:partId
export async function removePartController(req: Request, res: Response) {
  const ordemId = Number(req.params.id);
  const partId = Number(req.params.partId);
  const ordem = await removePart(ordemId, partId);
  return res.status(200).json(ordem);
}

const addServiceSchema = z.object({
  descricao: z.string().min(1, "Descrição é obrigatória."),
  valor: z.number().nonnegative("Valor não pode ser negativo."),
});

// POST /api/service-orders/:id/services
export async function addServiceController(req: Request, res: Response) {
  const ordemId = Number(req.params.id);
  const dados = addServiceSchema.parse(req.body);
  const ordem = await addService(ordemId, dados);
  return res.status(201).json(ordem);
}

// DELETE /api/service-orders/:id/services/:serviceId
export async function removeServiceController(req: Request, res: Response) {
  const ordemId = Number(req.params.id);
  const serviceId = Number(req.params.serviceId);
  const ordem = await removeService(ordemId, serviceId);
  return res.status(200).json(ordem);
}

const changeStatusSchema = z.object({
  status: statusSchema,
});

// PATCH /api/service-orders/:id/status
export async function changeStatusController(req: Request, res: Response) {
  const ordemId = Number(req.params.id);
  const { status } = changeStatusSchema.parse(req.body);
  const ordem = await changeStatus(ordemId, status);
  return res.status(200).json(ordem);
}

import { updateObservacoes } from "../services/serviceOrders.service";

const updateObservacoesSchema = z.object({
  observacoes: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v === "" ? undefined : v)),
});

// PATCH /api/service-orders/:id/observacoes
export async function updateObservacoesController(req: Request, res: Response) {
  const ordemId = Number(req.params.id);
  const { observacoes } = updateObservacoesSchema.parse(req.body);
  const ordem = await updateObservacoes(ordemId, observacoes);
  return res.status(200).json(ordem);
}
