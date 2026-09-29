import { Router } from "express";
import { StockController } from "../controllers/stock.controller";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";

const stockRoutes = Router();
const stockController = new StockController();

// Todas as rotas de estoque exigem autenticação
stockRoutes.use(ensureAuthenticated);

// Leitura: qualquer perfil autenticado (PROPRIETARIO ou FUNCIONARIO)
stockRoutes.get("/", stockController.list);
stockRoutes.get("/:id", stockController.getById);

// Escrita: somente PROPRIETARIO
stockRoutes.post("/", requireRole(["PROPRIETARIO"]), stockController.create);
stockRoutes.put("/:id", requireRole(["PROPRIETARIO"]), stockController.update);
stockRoutes.delete("/:id", requireRole(["PROPRIETARIO"]), stockController.delete);

export { stockRoutes };