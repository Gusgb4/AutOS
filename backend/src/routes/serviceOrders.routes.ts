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
  updateObservacoesController,
  listPaymentsController,
  registerPaymentController,
  reversePaymentController,
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
router.patch("/:id/observacoes", asyncHandler(updateObservacoesController));

//Pagamentos (contas a receber): valores e ações só para o proprietário
const somenteProprietario = requireRole(["PROPRIETARIO"]);
router.get(
  "/:id/payments",
  somenteProprietario,
  asyncHandler(listPaymentsController),
);
router.post(
  "/:id/payments",
  somenteProprietario,
  asyncHandler(registerPaymentController),
);
router.post(
  "/:id/payments/:paymentId/estorno",
  somenteProprietario,
  asyncHandler(reversePaymentController),
);

export default router;
