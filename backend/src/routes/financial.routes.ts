import { Router } from "express";
import * as financialController from "../controllers/financial.controller";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

router.use(ensureAuthenticated);
router.use(requireRole(["PROPRIETARIO"]));

router.get("/", asyncHandler(financialController.list));
router.get("/a-receber", asyncHandler(financialController.receivables));
router.get(
  "/despesas-por-categoria",
  asyncHandler(financialController.expensesByCategory),
);
router.post("/", asyncHandler(financialController.create));

export default router;
