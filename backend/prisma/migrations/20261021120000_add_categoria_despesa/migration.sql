-- CreateEnum
CREATE TYPE "CategoriaDespesa" AS ENUM ('ALUGUEL', 'SALARIO', 'PECAS', 'ENERGIA', 'OUTROS');

-- AlterTable
ALTER TABLE "financial_entries" ADD COLUMN     "categoria" "CategoriaDespesa";

-- Despesas que já existiam entram como OUTROS
UPDATE "financial_entries" SET "categoria" = 'OUTROS' WHERE "tipo" = 'DESPESA';
