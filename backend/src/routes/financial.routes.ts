import { Router } from "express";
import { 
  listFinancialEntriesController, 
  createFinancialEntryController,
  getTicketMedioController
} from "../controllers/financial.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);
router.use(requireRole(["PROPRIETARIO"]));

router.get("/", asyncHandler(listFinancialEntriesController));
router.post("/", asyncHandler(createFinancialEntryController));
router.get("/ticket-medio", asyncHandler(getTicketMedioController));

export default router;