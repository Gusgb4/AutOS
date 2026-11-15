import "dotenv/config";
import { execSync } from "node:child_process";
import path from "node:path";
import bcrypt from "bcryptjs";

// Prepara o banco dos testes E2E (Playwright): recria do zero com as
// migrations e cadastra os dados que os testes usam. Roda antes de subir o
// backend do E2E (veja e2e/playwright.config.ts).
//
// Apaga TUDO no banco, então só aceita banco com "e2e" no nome.

// Os mesmos valores estão em e2e/tests/dados.ts: mudou aqui, muda lá
const E2E = {
  dono: { nome: "Dono E2E", email: "dono.e2e@teste.com", senha: "senhaE2E123" },
  funcionario: {
    nome: "Funcionario E2E",
    email: "funcionario.e2e@teste.com",
    senha: "senhaE2E123",
  },
  cliente: { nome: "Cliente E2E", telefone: "47999990000" },
  veiculo: { placa: "E2E0001", marca: "Fiat", modelo: "Uno", ano: 2015 },
  peca: { nome: "Filtro de óleo E2E", quantidade: 10, valor_final: 40 },
};

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Defina a DATABASE_URL do banco do E2E.");

  const nomeDoBanco = new URL(url).pathname.replace(/^\//, "");
  if (!nomeDoBanco.toLowerCase().includes("e2e")) {
    throw new Error(
      `E2E abortado: o banco "${nomeDoBanco}" não tem "e2e" no nome. ` +
        "O E2E apaga todos os dados, então use um banco só pra ele (ex.: autos_e2e).",
    );
  }

  console.log(`Recriando o banco "${nomeDoBanco}" para o E2E...`);
  execSync("npx prisma migrate reset --force --skip-seed --skip-generate", {
    cwd: path.resolve(__dirname, "..", ".."),
    env: process.env,
    stdio: "inherit",
  });

  // Importado só depois do reset, pra conectar no banco já recriado
  const { prisma } = await import("../config/prisma");

  const senhaHash = await bcrypt.hash(E2E.dono.senha, 8);
  await prisma.user.createMany({
    data: [
      {
        nome: E2E.dono.nome,
        email: E2E.dono.email,
        senha: senhaHash,
        perfil: "PROPRIETARIO",
        trocar_senha: false,
      },
      {
        nome: E2E.funcionario.nome,
        email: E2E.funcionario.email,
        senha: senhaHash,
        perfil: "FUNCIONARIO",
        trocar_senha: false,
      },
    ],
  });

  const cliente = await prisma.client.create({ data: E2E.cliente });
  await prisma.vehicle.create({
    data: { ...E2E.veiculo, cliente_id: cliente.id, quilometragem_atual: 40000 },
  });
  await prisma.stockItem.create({
    data: { ...E2E.peca, quantidade_minima: 2, valor_entrada: 25 },
  });

  await prisma.$disconnect();
  console.log("Banco do E2E pronto.");
}

main().catch((erro) => {
  console.error(erro);
  process.exit(1);
});
