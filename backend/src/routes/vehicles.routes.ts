import { Router } from "express";
import {
  listController,
  getByIdController,
  createController,
  updateController,
  archiveController,
  unarchiveController,
} from "../controllers/vehicles.controller";
import { asyncHandler } from "../utils/asyncHandler";
import {
  ensureAuthenticated,
  requireRole,
} from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));
router.get("/:id", asyncHandler(getByIdController));
router.post("/", asyncHandler(createController));
// Funcionário cadastra e consulta; editar e arquivar é só do proprietário
router.put("/:id", requireRole(["PROPRIETARIO"]), asyncHandler(updateController));
router.patch(
  "/:id/archive",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(archiveController),
);
router.patch(
  "/:id/unarchive",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(unarchiveController),
);

export default router;