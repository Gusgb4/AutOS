import "dotenv/config";
import express from "express";
import cors from "cors";
import { prisma } from "./config/prisma";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ message: "API AutOS funcionando!" });
});

const PORT = process.env.PORT ?? 3333;

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Conectado ao banco de dados PostgreSQL");
  } catch (error) {
    console.error("❌ Falha ao conectar ao banco de dados:", error);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
  });
}

start();