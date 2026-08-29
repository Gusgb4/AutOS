import { Router } from "express";
import {
  listController,
  getByIdController,
  createController,
  addPartController,
  removePartController,
  addServiceController,
  removeServiceController,
  changeStatusController,
} from "../controllers/serviceOrders.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

//Feito com base em 3 tabelas que juntas formam uma OS

//Cabecalho da OS: cliente, veiculo, mecanico e status
router.get("/", asyncHandler(listController));
router.get("/:id", asyncHandler(getByIdController));
router.post("/", asyncHandler(createController));
router.patch("/:id/status", asyncHandler(changeStatusController));

//Adiciona as peças utilizadas na OS e da baixa no estoque
router.post("/:id/parts", asyncHandler(addPartController));
router.delete("/:id/parts/:partId", asyncHandler(removePartController));

//Serviços do mecanico feitos
router.post("/:id/services", asyncHandler(addServiceController));
router.delete("/:id/services/:serviceId", asyncHandler(removeServiceController));

export default router;
