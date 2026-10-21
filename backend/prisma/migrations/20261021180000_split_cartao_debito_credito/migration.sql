-- Antes só existia "CARTAO", sem saber se era débito ou crédito.
-- Os pagamentos antigos com cartão passam a contar como crédito.
ALTER TYPE "FormaPagamento" RENAME VALUE 'CARTAO' TO 'CREDITO';

ALTER TYPE "FormaPagamento" ADD VALUE 'DEBITO' BEFORE 'CREDITO';
