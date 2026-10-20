import { Router } from "express";
import clientsRoutes from "./clients.routes";
import { authRoutes } from "./auth.routes";
import { stockRoutes } from "./stock.routes";
import vehiclesRoutes from "./vehicles.routes";
import serviceOrdersRoutes from "./serviceOrders.routes";
import usersRoutes from "./users.routes";
import financialRoutes from "./financial.routes";
import reportsRoutes from "./reports.routes";
import notificacoesRoutes from "./notificacoes.routes";

const router = Router();

router.use("/clients", clientsRoutes);
router.use("/vehicles", vehiclesRoutes);
router.use("/auth", authRoutes);
router.use("/stock", stockRoutes);
router.use("/service-orders", serviceOrdersRoutes);
router.use("/users", usersRoutes);
router.use("/financial", financialRoutes);
router.use("/reports", reportsRoutes);
router.use("/notificacoes", notificacoesRoutes);

export default router;