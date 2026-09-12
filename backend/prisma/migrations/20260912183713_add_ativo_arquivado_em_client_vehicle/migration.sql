-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "arquivado_em" TIMESTAMP(3),
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vehicles" ADD COLUMN     "arquivado_em" TIMESTAMP(3),
ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "clients_ativo_idx" ON "clients"("ativo");

-- CreateIndex
CREATE INDEX "vehicles_ativo_idx" ON "vehicles"("ativo");
