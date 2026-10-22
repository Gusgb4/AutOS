# Plano de testes de aceitação (v3.0)

Roteiro para conferir o sistema inteiro **em produção**, logo depois do deploy,
seguindo a jornada real da oficina. Os testes automatizados do backend cobrem
as regras de negócio; este roteiro cobre o que só se vê usando: telas, PDF
impresso, WhatsApp, celular e o ambiente de produção.

Marque cada item. O que falhar vira uma correção antes de liberar para uso.

> **Importante:** este teste usa dados falsos no banco de produção. Ao final,
> siga a seção "Depois do teste" para zerar o banco antes do uso real.

**Executado por:** ______________________ **Data:** ____/____/______

**Aparelhos:** ☐ computador da oficina ☐ celular ☐ impressora

## 1. Acesso e equipe

- [ ] Login do proprietário com a senha provisória pede a troca de senha
- [ ] Depois de trocar, o login com a senha nova funciona
- [ ] Senha errada mostra mensagem de erro clara
- [ ] Depois de 10 tentativas erradas, o login fica bloqueado por alguns minutos
- [ ] Proprietário cria um funcionário e recebe a senha provisória dele
- [ ] Funcionário entra, troca a senha e **não vê** Financeiro, Relatórios e Equipe
- [ ] Funcionário não consegue editar nem arquivar cliente, veículo ou item de estoque
- [ ] Proprietário redefine a senha do funcionário, desativa e reativa a conta
- [ ] Conta desativada não consegue entrar
- [ ] F5 numa tela qualquer mantém o usuário logado; sair leva ao login

## 2. Clientes e veículos

- [ ] Cadastrar cliente com nome e telefone; editar e incluir e-mail e endereço
- [ ] Cadastrar veículo com cor e lembrete de revisão (dias e km)
- [ ] Buscar o cliente pelo nome e pela placa
- [ ] Arquivar e desarquivar cliente e veículo
- [ ] Perfil do cliente mostra veículos (com a cor), histórico de OS e total gasto

## 3. Estoque

- [ ] Cadastrar item com preço de venda, custo e quantidade mínima
- [ ] Item abaixo do mínimo aparece em destaque e no sino de notificações
- [ ] Item usado em OS não pode ser excluído, só arquivado

## 4. Dia de oficina (jornada completa)

- [ ] Abrir OS com reclamação do cliente, previsão de entrega e quilometragem
- [ ] Adicionar serviços e peças; o valor total é recalculado
- [ ] A peça baixa o estoque; removê-la devolve ao estoque
- [ ] Peça com estoque insuficiente mostra erro e não entra
- [ ] **Enviar por WhatsApp** abre o WhatsApp com o orçamento no formato da oficina
- [ ] **Baixar PDF** da OS aberta: "Orçamento", com a logo e a previsão (ou "A combinar")
- [ ] Editar os detalhes do atendimento; "Descartar" volta ao que estava salvo
- [ ] A quilometragem informada na abertura atualiza a do veículo
- [ ] **Encerrar OS** (confirma e finaliza)
- [ ] **Baixar PDF** da OS finalizada: "Nota de entrega", em uma página, com assinaturas no pé
- [ ] **Imprimir** a nota numa impressora de verdade e conferir a leitura no papel
- [ ] WhatsApp da OS finalizada diz "Seu veículo está pronto!"
- [ ] Reabrir a OS finalizada e finalizar de novo
- [ ] Cancelar uma OS aberta; o botão de PDF some
- [ ] OS com muitos serviços e peças continua cabendo em uma página no PDF

## 5. Pagamentos e financeiro (proprietário)

- [ ] OS aberta mostra o aviso de que o pagamento fica disponível depois de finalizar
- [ ] Registrar pagamento parcial (Pix): status "Parcial" e saldo correto
- [ ] Completar o pagamento (débito ou crédito): status "Pago"
- [ ] Estornar um pagamento: o valor volta ao saldo
- [ ] OS com pagamento ativo não pode ser cancelada
- [ ] Contas a receber lista as OS finalizadas com saldo
- [ ] Lançar despesa com categoria e receita manual; estornar um lançamento manual
- [ ] Filtros do Financeiro (tipo, categoria, forma, período, mostrar estornados)
- [ ] Cards do topo comparam com o período anterior
- [ ] Blocos "Recebido por forma de pagamento" e "Despesas por categoria" batem com os lançamentos
- [ ] "Ocultar valores" esconde todos os valores

## 6. Relatórios (proprietário)

- [ ] Vendas, inventário, resumo financeiro e atividade do cliente abrem com dados
- [ ] Atalhos de período e período personalizado; data inicial maior que a final mostra aviso
- [ ] Exportar cada relatório em CSV (abre certo no Excel) e em PDF (com a logo)
- [ ] Produtividade por mecânico na tela de equipe

## 7. Notificações

- [ ] Sino mostra revisão vencida ou próxima, estoque baixo e pagamento atrasado
- [ ] Botão de WhatsApp da revisão abre a mensagem para o cliente

## 8. LGPD

- [ ] Remover dados de um cliente com OS em aberto é recusado com mensagem clara
- [ ] Remover dados de um cliente sem pendências (digitando REMOVER): o perfil
      mostra o aviso, o cliente some da lista e as OS antigas mostram "Cliente removido"
- [ ] Cliente removido não pode ser editado nem receber veículo
- [ ] Termos de Uso e Política de Privacidade abrem pelo login, inclusive no celular
- [ ] Logins aparecem no registro de acesso (consulta no banco)

## 9. Celular

- [ ] Login, lista de OS, detalhe da OS e cadastro de cliente utilizáveis no celular
- [ ] Botões grandes o bastante para o toque; nada cortado na lateral

## 10. Produção

- [ ] Primeiro acesso do dia, com o backend "dormindo": o sistema acorda e funciona
- [ ] O site só aceita chamadas do domínio da Vercel (`CORS_ORIGIN` configurado)
- [ ] Backup do banco configurado e testado (restaurar uma cópia num banco de teste)

## Depois do teste

1. Anotar as falhas encontradas e corrigir antes de liberar.
2. **Zerar o banco de produção** (apaga todos os dados do teste):
   ```bash
   cd backend
   # com a DATABASE_URL do banco de produção
   npx prisma migrate reset --force --skip-seed
   ```
3. Criar a conta do proprietário de verdade:
   ```bash
   npm run criar-proprietario -- email@dono.com "Nome do Dono"
   ```
4. Entregar a senha provisória ao proprietário e começar o uso piloto.

## Falhas encontradas

| # | Seção | O que aconteceu | Corrigido? |
|---|---|---|---|
| 1 | | | |
| 2 | | | |
| 3 | | | |
