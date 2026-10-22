# AutOS v3.0 (MVP3)

Versão final do projeto do PAC Extensionista VI. Fecha o ciclo da oficina, do
orçamento à entrega do veículo e ao recebimento, e prepara o sistema para uso
real na Franz Motors: documentos impressos, conformidade com a LGPD, testes
automatizados e polimento geral.

Inclui tudo o que entrou depois da release MVP2.5 (PRs #19 a #45).

## Ordem de serviço

- **Nota de entrega e orçamento em PDF**, com a logo da oficina, em preto e
  cinza e sempre em uma página (a letra diminui sozinha quando a OS é longa).
  - Orçamento: previsão de entrega.
  - Nota de entrega: entrada e saída, placa e cor, reclamação do cliente,
    serviços executados, peças, totais, informações ao cliente, declaração de
    recebimento e assinaturas.
  - OS cancelada não gera PDF.
- **Orçamento pelo WhatsApp** no formato que a oficina já usava, com o pedido
  de autorização; quando a OS é finalizada, a mensagem vira "Seu veículo está
  pronto!".
- **Detalhes do atendimento**: reclamação do cliente, previsão de entrega e
  informações ao cliente.
- **Cor do veículo** no cadastro.
- **Margem das peças** na OS (custo registrado no momento em que a peça entra),
  visível só para o proprietário.
- Componentes de serviço e peça unificados na abertura e no detalhe da OS.

## Pagamentos e contas a receber

- Pagamentos registrados na própria OS depois de finalizada, parciais ou
  totais, com estorno. Status de pagamento: pendente, parcial ou pago.
- **Forma de pagamento**: Pix, dinheiro, débito, crédito ou outro, escolhida
  por botões.
- **Contas a receber** no Financeiro: OS finalizadas com saldo em aberto.
- OS com pagamento ativo não pode ser cancelada sem estornar antes.

## Financeiro

- **Comparativo período a período** nos cards do dashboard.
- **Despesas por categoria** (aluguel, salário, peças, energia, outros), com
  filtro e gráfico de barras.
- **Recebido por forma de pagamento**, para conferir com o banco e a maquininha.
- **Estorno de lançamento manual**, com os estornados visíveis num filtro.

## Relatórios

- Exportação em **PDF**, além do CSV.
- **Comparativo** com o período anterior em todos os relatórios.
- Relatórios de faturamento contam só OS finalizadas.
- Resumo financeiro com mão de obra × peças, margem das peças e recebido por
  forma de pagamento.
- **Giro de estoque e previsão de falta** no inventário.
- **Produtividade** por mecânico.

## Notificações

- Sino com revisões vencidas ou próximas, estoque abaixo do mínimo e, para o
  proprietário, pagamentos atrasados.

## Usuários, permissões e segurança

- Contas criadas pelo proprietário com **senha provisória** e troca
  obrigatória no primeiro acesso; redefinição de senha e ativação/desativação.
- Funcionário não edita nem arquiva clientes, veículos e estoque, e não acessa
  financeiro, pagamentos e relatórios (verificado no backend).
- **Limite de tentativas de login**: 10 a cada 15 minutos por IP.
- Item de estoque já usado em OS é arquivado em vez de excluído.

## LGPD e Marco Civil

- **Remoção de dados de cliente** (anonimização): apaga nome, telefone,
  documento, e-mail, endereço e placas, mantendo o histórico de serviços e o
  financeiro sem identificar a pessoa.
- **Registro de acesso** por 6 meses (Marco Civil, art. 15), apagado
  automaticamente depois.
- **Termos de Uso e Política de Privacidade** reescritos conforme o sistema
  real, com a Franz Motors como controladora.

## Qualidade

- **87 testes automatizados** no backend (Vitest + Supertest), em banco
  separado: autenticação e perfis, contas de usuário, OS (estoque, km, status e
  lembrete), pagamentos e contas a receber, lançamentos manuais, LGPD e
  detalhes da OS.
- Lint do frontend zerado (de 24 erros para 0).
- Mensagens de erro claras no estoque e no login.
- Telas ajustadas para o celular.

## Correções

- Apagar o texto das observações da OS não limpava o campo.
- Relatório de vendas contava OS que não estavam finalizadas.
- Link da Política de Privacidade dentro dos Termos levava à página 404.

## Removido

- Gráfico de faturado × recebido do Financeiro, substituído pelos blocos de
  recebido por forma de pagamento e despesas por categoria.

## Atualizando de uma versão anterior

O banco precisa das migrations novas:

```bash
cd backend
npx prisma migrate deploy
```
