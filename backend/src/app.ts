import express from "express";
import cors from "cors";
import { env } from "./config/env";
import routes from "./routes";
import { errorMiddleware } from "./middlewares/error.middleware";

export const app = express();

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api", routes);

// Sempre por último — Express identifica middleware de erro pela quantidade de parâmetros (4),
// mas a ORDEM de registro também importa: ele só captura erros de rotas registradas ANTES dele.
app.use(errorMiddleware);