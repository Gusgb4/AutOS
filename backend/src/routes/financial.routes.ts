import { Router } from "express";
import * as financialController from "../controllers/financial.controller";

const router = Router();

router.get("/", financialController.list);
router.post("/", financialController.create);

export default router;