-- AlterTable
ALTER TABLE "stock_items" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "stock_items_ativo_idx" ON "stock_items"("ativo");
