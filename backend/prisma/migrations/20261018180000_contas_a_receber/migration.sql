-- CreateEnum
CREATE TYPE "StatusPagamento" AS ENUM ('PENDENTE', 'PARCIAL', 'PAGO');

-- CreateEnum
CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO_DEBITO', 'CARTAO_CREDITO', 'BOLETO', 'TRANSFERENCIA');

-- AlterTable
ALTER TABLE "service_orders" ADD COLUMN     "valor_pago" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "status_pagamento" "StatusPagamento" NOT NULL DEFAULT 'PENDENTE';

-- AlterTable
ALTER TABLE "financial_entries" ADD COLUMN     "forma_pagamento" "FormaPagamento";

-- CreateIndex
CREATE INDEX "service_orders_status_pagamento_idx" ON "service_orders"("status_pagamento");

-- Dados existentes: a receita que era gerada no encerramento da OS conta como pagamento
UPDATE "service_orders" AS so
SET "valor_pago" = recebido.total
FROM (
    SELECT "ordemId", SUM("valor") AS total
    FROM "financial_entries"
    WHERE "tipo" = 'RECEITA' AND "estornado" = false AND "ordemId" IS NOT NULL
    GROUP BY "ordemId"
) AS recebido
WHERE so."id" = recebido."ordemId";

UPDATE "service_orders"
SET "status_pagamento" = (
    CASE
        WHEN "valor_pago" >= "valor_total" THEN 'PAGO'
        WHEN "valor_pago" > 0 THEN 'PARCIAL'
        ELSE 'PENDENTE'
    END
)::"StatusPagamento";
