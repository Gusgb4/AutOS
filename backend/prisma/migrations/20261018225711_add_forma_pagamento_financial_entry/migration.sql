CREATE TYPE "FormaPagamento" AS ENUM ('DINHEIRO', 'PIX', 'CARTAO', 'OUTRO');

ALTER TABLE "financial_entries" ADD COLUMN     "forma_pagamento" "FormaPagamento";
