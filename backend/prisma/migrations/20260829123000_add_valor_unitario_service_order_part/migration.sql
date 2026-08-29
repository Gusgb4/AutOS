-- AlterTable
ALTER TABLE "service_order_parts" ADD COLUMN     "valor_unitario" DECIMAL(10,2) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "service_order_parts_ordem_id_item_estoque_id_key" ON "service_order_parts"("ordem_id", "item_estoque_id");
