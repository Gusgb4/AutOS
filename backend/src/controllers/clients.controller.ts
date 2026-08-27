import { Request, Response } from "express";
import { search } from "../services/clients.service";

//filtro de clientes
export async function listController(req: Request, res: Response) {
  const termo = typeof req.query.busca === "string" ? req.query.busca : undefined;
  const clientes = await search(termo);
  return res.status(200).json(clientes);
}