import express from "express";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

// Atrás do proxy do Render, o IP real do cliente vem no X-Forwarded-For.
// Sem isso o limite de tentativas de login enxergaria todos como um único IP.
app.set("trust proxy", 1);

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});
app.use("/api", routes);
app.use(errorMiddleware);
