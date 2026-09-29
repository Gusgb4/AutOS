import { Router } from "express";
import { salesController } from "../controllers/reports.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/sales", asyncHandler(salesController));

export default router;