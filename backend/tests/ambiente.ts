import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

const ARQUIVO_ENV_TEST = path.resolve(__dirname, "..", ".env.test");

// Carrega o .env.test por cima de qualquer variável que já exista e garante
// que o banco é de teste, porque o setup apaga tudo nele
export function carregarAmbienteDeTeste() {
  if (!fs.existsSync(ARQUIVO_ENV_TEST)) {
    throw new Error(
      "Arquivo backend/.env.test não encontrado. Copie o .env.test.example e ajuste o DATABASE_URL.",
    );
  }

  dotenv.config({ path: ARQUIVO_ENV_TEST, override: true, quiet: true });

  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL não definida no .env.test.");
  }

  const nomeDoBanco = new URL(url).pathname.replace(/^\//, "");
  if (!nomeDoBanco.toLowerCase().includes("test")) {
    throw new Error(
      `Testes abortados: o banco "${nomeDoBanco}" não tem "test" no nome. ` +
        "Os testes apagam todos os dados, então use um banco só para eles (ex.: autos_test).",
    );
  }

  return { url, nomeDoBanco };
}
