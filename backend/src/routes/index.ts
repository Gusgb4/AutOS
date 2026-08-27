import { Router } from "express";
import clientsRoutes from "./clients.routes";
import { authRoutes } from "./auth.routes";

const router = Router();

router.use("/clients", clientsRoutes);
router.use("/auth", authRoutes);

export default router;