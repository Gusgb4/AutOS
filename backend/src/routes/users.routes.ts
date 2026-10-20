import { Router } from "express";
import {
  activateController,
  createController,
  deactivateController,
  listController,
  resetPasswordController,
  produtividadeController,
} from "../controllers/users.controller";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));

router.post("/", requireRole(["PROPRIETARIO"]), asyncHandler(createController));

router.patch(
  "/:id/redefinir-senha",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(resetPasswordController),
);

router.get(
  "/produtividade",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(produtividadeController),
);
router.patch(
  "/:id/deactivate",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(deactivateController),
);

router.patch(
  "/:id/activate",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(activateController),
);

export default router;
