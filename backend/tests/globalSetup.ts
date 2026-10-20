import { execSync } from "node:child_process";
import path from "node:path";
import { carregarAmbienteDeTeste } from "./ambiente";

// Roda uma vez antes de todos os testes: recria o banco de teste do zero
// aplicando todas as migrations
export default function setup() {
  const { nomeDoBanco } = carregarAmbienteDeTeste();

  try {
    execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
      cwd: path.resolve(__dirname, ".."),
      env: process.env,
      stdio: "pipe",
    });
  } catch (erro) {
    const saida = (erro as { stdout?: Buffer; stderr?: Buffer });
    throw new Error(
      `Falha ao preparar o banco de teste "${nomeDoBanco}":\n` +
        `${saida.stdout?.toString() ?? ""}${saida.stderr?.toString() ?? ""}`,
    );
  }
}
