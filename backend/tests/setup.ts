import { afterAll, beforeEach } from "vitest";
import { carregarAmbienteDeTeste } from "./ambiente";

// Precisa vir antes de importar o app: o env.ts e o Prisma leem o DATABASE_URL
carregarAmbienteDeTeste();

const { prisma } = await import("../src/config/prisma");
const { limparBanco } = await import("./helpers/banco");

// Cada teste começa com o banco vazio
beforeEach(async () => {
  await limparBanco();
});

afterAll(async () => {
  await prisma.$disconnect();
});
