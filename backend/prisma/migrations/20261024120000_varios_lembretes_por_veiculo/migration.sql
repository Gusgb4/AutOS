-- Vários lembretes por veículo, cada um com nome (troca de óleo, correia...)

-- Deixa de ser um lembrete por veículo
DROP INDEX "maintenance_reminders_veiculo_id_key";

-- Os lembretes que já existiam passam a se chamar "Revisão"
ALTER TABLE "maintenance_reminders" ADD COLUMN "nome" TEXT NOT NULL DEFAULT 'Revisão';
ALTER TABLE "maintenance_reminders" ALTER COLUMN "nome" DROP DEFAULT;

-- Busca dos lembretes de um veículo
CREATE INDEX "maintenance_reminders_veiculo_id_idx" ON "maintenance_reminders"("veiculo_id");
