-- Nota de entrega: reclamação do cliente e previsão na OS, cor no veículo

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "cor" TEXT;

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "previsao_entrega" TIMESTAMP(3),
ADD COLUMN     "reclamacao" TEXT;

