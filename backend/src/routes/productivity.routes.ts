import { Router } from "express";
import * as productivityController from "../controllers/productivity.controller";

const router = Router();

router.get("/", productivityController.getReport);

export default router;