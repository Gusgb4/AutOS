import { Router } from "express";
import { listController } from "../controllers/users.controller";
import { asyncHandler } from "../utils/asyncHandler";
import { ensureAuthenticated } from "../middlewares/auth.middleware";

const router = Router();

router.use(ensureAuthenticated);

router.get("/", asyncHandler(listController));

export default router;