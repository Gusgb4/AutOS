import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";
import {
  vendasController,
  inventarioController,
  resumoController,
  atividadeController,
} from "../controllers/reports.controller";

const router = Router();

router.use(ensureAuthenticated);
router.use(requireRole(["PROPRIETARIO"]));

router.get("/sales", asyncHandler(vendasController));
router.get("/inventory", asyncHandler(inventarioController));
router.get("/financial-summary", asyncHandler(resumoController));
router.get("/client-activity", asyncHandler(atividadeController));

export default router;