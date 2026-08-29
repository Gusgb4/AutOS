import { Router } from "express";
import clientsRoutes from "./clients.routes";
import { authRoutes } from "./auth.routes";
import { stockRoutes } from "./stock.routes";
import vehiclesRoutes from "./vehicles.routes";
import serviceOrdersRoutes from "./serviceOrders.routes";
import usersRoutes from "./users.routes";

const router = Router();

router.use("/clients", clientsRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/auth", authRoutes);
router.use("/stock", stockRoutes);
router.use("/service-orders", serviceOrdersRoutes);
router.use("/users", usersRoutes);

export default router;