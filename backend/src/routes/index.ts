import { Router } from "express";
import clientsRoutes from "./clients.routes";
import { authRoutes } from "./auth.routes";
import { stockRoutes } from "./stock.routes";

const router = Router();

router.use("/clients", clientsRoutes);
router.use("/auth", authRoutes);
router.use("/stock", stockRoutes);

export default router;