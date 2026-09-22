import { Request, Response } from "express";
import * as productivityService from "../services/productivity.service";

export async function getReport(req: Request, res: Response) {
  try {
    const mes = (req.query.mes as string) || new Date().toISOString().slice(0, 7);
    const relatorio = await productivityService.getProductivity(mes);
    return res.json(relatorio);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ erro: "Erro ao gerar o relatório de produtividade." });
  }
}