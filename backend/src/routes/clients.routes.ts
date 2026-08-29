import { Router } from "express";
import { listController, createController, getByIdController, updateController, removeController } from "../controllers/clients.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// TODO: quando auth.middleware.ts existir, adicionar router.use(authMiddleware) aqui

router.get("/", asyncHandler(listController));
router.post("/", asyncHandler(createController));
router.get("/:id", asyncHandler(getByIdController));
router.put("/:id", asyncHandler(updateController));
router.delete("/:id", asyncHandler(removeController));

export default router;