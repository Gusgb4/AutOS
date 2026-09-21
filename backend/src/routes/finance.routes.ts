import { Router } from "express";
import {
  listEntriesController,
  getEntryByIdController,
  createEntryController,
  updateEntryController,
  deleteEntryController,
} from "../controllers/finance.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/entries", asyncHandler(listEntriesController));
router.get("/entries/:id", asyncHandler(getEntryByIdController));
router.post("/entries", asyncHandler(createEntryController));
router.put("/entries/:id", asyncHandler(updateEntryController));
router.delete("/entries/:id", asyncHandler(deleteEntryController));

export default router;
