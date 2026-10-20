import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../config/prisma";
import { gerarSenhaProvisoria } from "../utils/senha";

async function main() {
  const [, , emailArg, nomeArg] = process.argv;

  if (!emailArg || !nomeArg) {
    console.error('Uso: npm run criar-proprietario -- <email> "<nome>"');
    process.exit(1);
  }

  const email = emailArg.trim().toLowerCase();
  const nome = nomeArg.trim();

  const senhaProvisoria = gerarSenhaProvisoria(10);
  const senhaHash = await bcrypt.hash(senhaProvisoria, 10);

  // Se o email já existe, vira proprietário ativo com nova senha (caso o dono esqueça a senha)
  const user = await prisma.user.upsert({
    where: { email },
    update: {
      perfil: "PROPRIETARIO",
      ativo: true,
      senha: senhaHash,
      trocar_senha: true,
    },
    create: {
      nome,
      email,
      senha: senhaHash,
      perfil: "PROPRIETARIO",
      ativo: true,
      trocar_senha: true,
    },
  });

  console.log("==========================================");
  console.log("✅ Proprietário criado com sucesso!");
  console.log(`ID: ${user.id}`);
  console.log(`Nome: ${user.nome}`);
  console.log(`Email: ${user.email}`);
  console.log(`Senha Provisória: ${senhaProvisoria}`);
  console.log("⚠️  Anote a senha acima. Ela será exigida no primeiro acesso.");
  console.log("==========================================");
}

main()
  .catch((err) => {
    console.error("Erro ao criar proprietário:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
