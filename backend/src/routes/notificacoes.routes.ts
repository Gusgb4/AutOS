import { Router } from "express";
import { listController } from "../controllers/notificacoes.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

// Qualquer perfil logado vê as notificações
router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));

export default router;