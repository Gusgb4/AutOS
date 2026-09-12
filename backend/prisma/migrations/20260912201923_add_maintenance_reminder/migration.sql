-- CreateTable
CREATE TABLE "maintenance_reminders" (
    "id" SERIAL NOT NULL,
    "veiculo_id" INTEGER NOT NULL,
    "intervalo_dias" INTEGER NOT NULL,
    "intervalo_km" INTEGER NOT NULL,
    "proxima_data" TIMESTAMP(3) NOT NULL,
    "proximo_km" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "maintenance_reminders_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "maintenance_reminders_veiculo_id_key" ON "maintenance_reminders"("veiculo_id");

-- AddForeignKey
ALTER TABLE "maintenance_reminders" ADD CONSTRAINT "maintenance_reminders_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "vehicles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
