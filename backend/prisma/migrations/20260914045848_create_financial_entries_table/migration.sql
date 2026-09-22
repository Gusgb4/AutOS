-- CreateTable
CREATE TABLE "financial_entries" (
    "id" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estornado" BOOLEAN NOT NULL DEFAULT false,
    "ordemId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "financial_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "financial_entries_ordemId_idx" ON "financial_entries"("ordemId");

-- AddForeignKey
ALTER TABLE "financial_entries" ADD CONSTRAINT "financial_entries_ordemId_fkey" FOREIGN KEY ("ordemId") REFERENCES "service_orders"("id") ON DELETE SET NULL ON UPDATE CASCADE;
