import { Router } from "express";
import {
  listController,
  getByIdController,
  createController,
  updateController,
  archiveController,
} from "../controllers/vehicles.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));
router.get("/:id", asyncHandler(getByIdController));
router.post("/", asyncHandler(createController));
router.put("/:id", asyncHandler(updateController));
router.patch("/:id/archive", asyncHandler(archiveController));

export default router;