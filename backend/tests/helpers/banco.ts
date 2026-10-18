import { prisma } from "../../src/config/prisma";

// Esvazia todas as tabelas (menos o histórico de migrations) e zera os ids
export async function limparBanco() {
  const tabelas = await prisma.$queryRaw<{ tablename: string }[]>`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'
  `;
  if (tabelas.length === 0) return;

  const lista = tabelas.map((t) => `"${t.tablename}"`).join(", ");
  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${lista} RESTART IDENTITY CASCADE`,
  );
}
