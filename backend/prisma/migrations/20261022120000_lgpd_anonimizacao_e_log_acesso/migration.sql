-- LGPD: marca o cliente que teve os dados pessoais apagados
-- Marco Civil: registro de acesso guardado por 6 meses

-- CreateEnum
CREATE TYPE "EventoAcesso" AS ENUM ('LOGIN_OK', 'LOGIN_FALHA');

-- AlterTable
ALTER TABLE "clients" ADD COLUMN     "anonimizado_em" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "access_logs" (
    "id" SERIAL NOT NULL,
    "evento" "EventoAcesso" NOT NULL,
    "usuario_id" INTEGER,
    "email" TEXT NOT NULL,
    "ip" TEXT NOT NULL,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "access_logs_created_at_idx" ON "access_logs"("created_at");

-- AddForeignKey
ALTER TABLE "access_logs" ADD CONSTRAINT "access_logs_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

