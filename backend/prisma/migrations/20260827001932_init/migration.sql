-- CreateEnum
CREATE TYPE "Perfil" AS ENUM ('PROPRIETARIO', 'FUNCIONARIO');

-- CreateEnum
CREATE TYPE "StatusOrdemServico" AS ENUM ('ABERTA', 'EM_ANDAMENTO', 'FINALIZADA', 'CANCELADA');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "perfil" "Perfil" NOT NULL DEFAULT 'FUNCIONARIO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "documento" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "placa" TEXT NOT NULL,
    "marca" TEXT NOT NULL,
    "modelo" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vehicles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_items" (
    "id" SERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "quantidade_minima" INTEGER NOT NULL DEFAULT 0,
    "valor_unitario" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_orders" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "veiculo_id" INTEGER NOT NULL,
    "mecanico_id" INTEGER NOT NULL,
    "status" "StatusOrdemServico" NOT NULL DEFAULT 'ABERTA',
    "valor_total" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_services" (
    "id" SERIAL NOT NULL,
    "ordem_id" INTEGER NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "service_order_services_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_order_parts" (
    "id" SERIAL NOT NULL,
    "ordem_id" INTEGER NOT NULL,
    "item_estoque_id" INTEGER NOT NULL,
    "quantidade" INTEGER NOT NULL,

    CONSTRAINT "service_order_parts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "clients_documento_key" ON "clients"("documento");

-- CreateIndex
CREATE INDEX "clients_nome_idx" ON "clients"("nome");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_placa_key" ON "vehicles"("placa");

-- CreateIndex
CREATE INDEX "vehicles_placa_idx" ON "vehicles"("placa");

-- CreateIndex
CREATE INDEX "vehicles_cliente_id_idx" ON "vehicles"("cliente_id");

-- CreateIndex
CREATE INDEX "stock_items_nome_idx" ON "stock_items"("nome");

-- CreateIndex
CREATE INDEX "service_orders_cliente_id_idx" ON "service_orders"("cliente_id");

-- CreateIndex
CREATE INDEX "service_orders_veiculo_id_idx" ON "service_orders"("veiculo_id");

-- CreateIndex
CREATE INDEX "service_orders_mecanico_id_idx" ON "service_orders"("mecanico_id");

-- CreateIndex
CREATE INDEX "service_orders_status_idx" ON "service_orders"("status");

-- CreateIndex
CREATE INDEX "service_order_services_ordem_id_idx" ON "service_order_services"("ordem_id");

-- CreateIndex
CREATE INDEX "service_order_parts_ordem_id_idx" ON "service_order_parts"("ordem_id");

-- CreateIndex
CREATE INDEX "service_order_parts_item_estoque_id_idx" ON "service_order_parts"("item_estoque_id");

-- AddForeignKey
ALTER TABLE "vehicles" ADD CONSTRAINT "vehicles_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clients"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_veiculo_id_fkey" FOREIGN KEY ("veiculo_id") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_orders" ADD CONSTRAINT "service_orders_mecanico_id_fkey" FOREIGN KEY ("mecanico_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_services" ADD CONSTRAINT "service_order_services_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_parts" ADD CONSTRAINT "service_order_parts_ordem_id_fkey" FOREIGN KEY ("ordem_id") REFERENCES "service_orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_order_parts" ADD CONSTRAINT "service_order_parts_item_estoque_id_fkey" FOREIGN KEY ("item_estoque_id") REFERENCES "stock_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
