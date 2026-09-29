import { Router } from "express";
import {
  activateController,
  deactivateController,
  listController,
} from "../controllers/users.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated, requireRole } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));
router.patch(
  "/:id/deactivate",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(deactivateController),
);
router.patch(
  "/:id/activate",
  requireRole(["PROPRIETARIO"]),
  asyncHandler(activateController),
);

export default router;