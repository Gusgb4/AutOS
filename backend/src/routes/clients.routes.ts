import { Router } from "express";
import { listController } from "../controllers/clients.controller";
import { asyncHandler } from "../utils/asyncHandler";

const router = Router();

// TODO: quando auth.middleware.ts existir, adicionar router.use(authMiddleware) aqui
router.get("/", asyncHandler(listController));
// TODO: router.post("/", ...), router.put("/:id", ...), router.delete("/:id", ...)

export default router;