-- CreateEnum
CREATE TYPE "TipoLancamento" AS ENUM ('ENTRADA', 'SAIDA');

-- CreateTable
CREATE TABLE "financial_entries" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoLancamento" NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "ordem_id" INTEGER,
    "estornado" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_entries_data_idx" ON "financial_entries"("data");

-- CreateIndex
CREATE INDEX "financial_entries_tipo_idx" ON "financial_entries"("tipo");

-- CreateIndex
CREATE INDEX "financial_entries_ordem_id_idx" ON "financial_entries"("ordem_id");

-- CreateIndex
CREATE INDEX "financial_entries_estornado_idx" ON "financial_entries"("estornado");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "service_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

