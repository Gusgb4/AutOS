import { Router } from "express";
import { listController, createController, getByIdController, updateController, removeController } from "../controllers/clients.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));
router.post("/", asyncHandler(createController));
router.get("/:id", asyncHandler(getByIdController));
router.put("/:id", asyncHandler(updateController));
router.delete("/:id", asyncHandler(removeController));

export default router;