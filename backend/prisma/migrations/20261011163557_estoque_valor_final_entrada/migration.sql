-- AlterTable
ALTER TABLE "stock_items" RENAME COLUMN "valor_unitario" TO "valor_final";

-- AlterTable
ALTER TABLE "stock_items" ADD COLUMN     "valor_entrada" DECIMAL(10,2);
