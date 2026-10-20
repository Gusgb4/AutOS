import { Router } from "express";
import { listController, createController, getByIdController, updateController, archiveController, unarchiveController } from "../controllers/clients.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));
router.post("/", asyncHandler(createController));
router.get("/:id", asyncHandler(getByIdController));
// Funcionário cadastra e consulta; editar e arquivar é só do proprietário
router.put("/:id", requireRole(["PROPRIETARIO"]), asyncHandler(updateController));
router.patch("/:id/archive", requireRole(["PROPRIETARIO"]), asyncHandler(archiveController));
router.patch("/:id/unarchive", requireRole(["PROPRIETARIO"]), asyncHandler(unarchiveController));

export default router;