import { Request, Response } from "express";
import * as financialService from "../services/financial.service";

export async function list(req: Request, res: Response) {
  try {
    const filtros = {
      tipo: req.query.tipo as string,
      inicio: req.query.inicio as string,
      fim: req.query.fim as string
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
      return res.status(400).json({ erro: "Preencha todos os campos obrigatórios." });
    }

    const lancamento = await financialService.createEntry({ tipo, descricao, valor, data });
    return res.status(201).json(lancamento);
  } catch (error) {
    return res.status(500).json({ erro: "Erro ao criar lançamento." });
  }
}