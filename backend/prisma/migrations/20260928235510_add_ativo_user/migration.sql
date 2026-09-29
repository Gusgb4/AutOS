-- AlterTable
ALTER TABLE "users" ADD COLUMN     "ativo" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "users_ativo_idx" ON "users"("ativo");
