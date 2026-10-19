ALTER TABLE "service_orders" ADD COLUMN     "finalizada_em" TIMESTAMP(3);

CREATE INDEX "service_orders_status_finalizada_em_idx" ON "service_orders"("status", "finalizada_em");

UPDATE "service_orders" so
SET "finalizada_em" = COALESCE(
  (SELECT MAX(fe."data") FROM "financial_entries" fe
   WHERE fe."ordemId" = so."id" AND fe."estornado" = false AND fe."tipo" = 'RECEITA'),
  so."updated_at"
)
WHERE so."status" = 'FINALIZADA';
