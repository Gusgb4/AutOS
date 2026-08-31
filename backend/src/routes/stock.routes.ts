import { Router } from "express";
import { StockController } from "../controllers/stock.controller";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";

const stockRoutes = Router();
const stockController = new StockController();

//Rotas de estoque protegidas por autenticação
stockRoutes.use(ensureAuthenticated);
stockRoutes.use(requireRole(["PROPRIETARIO"]));

stockRoutes.post("/", stockController.create);
stockRoutes.get("/", stockController.list);
stockRoutes.get("/:id", stockController.getById);
stockRoutes.put("/:id", stockController.update);
stockRoutes.delete("/:id", stockController.delete);

export { stockRoutes };
