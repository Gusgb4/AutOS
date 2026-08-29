import { Router } from "express";
import {
  listController,
  getByIdController,
  createController,
  updateController,
  removeController,
} from "../controllers/vehicles.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));
router.get("/:id", asyncHandler(getByIdController));
router.post("/", asyncHandler(createController));
router.put("/:id", asyncHandler(updateController));
router.delete("/:id", asyncHandler(removeController));

export default router;