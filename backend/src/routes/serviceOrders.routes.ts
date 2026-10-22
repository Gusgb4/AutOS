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
  updateDetalhesController,
  registrarPagamentoController,
  listarPagamentosController,
  estornarPagamentoController,
} from "../controllers/serviceOrders.controller";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";

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
router.delete(
  "/:id/services/:serviceId",
  asyncHandler(removeServiceController),
);
router.patch("/:id/detalhes", asyncHandler(updateDetalhesController));

router.get("/:id/pagamentos", asyncHandler(listarPagamentosController));
router.post(
  "/:id/pagamentos",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(registrarPagamentoController),
);
router.patch(
  "/:id/pagamentos/:pagamentoId/estornar",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(estornarPagamentoController),
);

export default router;
