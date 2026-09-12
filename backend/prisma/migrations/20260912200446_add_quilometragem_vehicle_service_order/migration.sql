-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "quilometragem_registrada" INTEGER;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "quilometragem_atual" INTEGER NOT NULL DEFAULT 0;
