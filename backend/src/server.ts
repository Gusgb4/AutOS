import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./config/prisma";

async function start() {
  try {
    await prisma.$connect();
    console.log("✅ Conectado ao banco de dados PostgreSQL");
  } catch (error) {
    console.error("❌ Falha ao conectar ao banco de dados:", error);
    process.exit(1);
  }

  app.listen(env.port, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${env.port}`);
  });
}

start();