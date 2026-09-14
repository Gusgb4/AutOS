import { Router } from "express";
import { 
  listFinancialEntriesController, 
  createFinancialEntryController 
} from "../controllers/financial.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);
router.use(requireRole(["PROPRIETARIO"]));

router.get("/", asyncHandler(listFinancialEntriesController));
router.post("/", asyncHandler(createFinancialEntryController));

export default router;