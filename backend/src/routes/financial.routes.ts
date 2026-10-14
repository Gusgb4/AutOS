import { Router } from "express";
import * as financialController from "../controllers/financial.controller";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);
router.use(requireRole(["PROPRIETARIO"]));

router.get("/", financialController.list);
router.post("/", financialController.create);

export default router;
