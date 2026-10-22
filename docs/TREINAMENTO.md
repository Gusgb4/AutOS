# Roteiro de treinamento · AutOS

Roteiro para apresentar o AutOS à equipe da oficina na prática: cada pessoa
faz as tarefas no próprio sistema, em vez de só assistir. O passo a passo de
cada tarefa está no [Manual do usuário](MANUAL.md).

## Como organizar

- **Quando:** depois do deploy e do plano de testes, **antes** de zerar o banco
  de produção (assim todos treinam com dados de teste, sem medo de errar).
- **Duração:** cerca de 1h30 no total. Sessão 1 com todos (1h) e sessão 2 só com
  o proprietário (30 min).
- **Material:** um computador, um celular com WhatsApp e a impressora da
  oficina. Cada pessoa com a própria conta já criada (senha provisória em mãos).
- **Dados de exemplo:** um cliente fictício com veículo e cinco peças
  cadastradas no estoque, criados antes da sessão.

## Sessão 1: dia a dia da oficina (todos, ~1h)

| Tempo | Tema | O que cada pessoa faz |
|---|---|---|
| 10 min | Primeiro acesso | Entra com a senha provisória, cria a própria senha, conhece o menu e o sino |
| 10 min | Clientes e veículos | Cadastra um cliente e um veículo com dois lembretes (troca de óleo e correia); busca pelo nome e pela placa |
| 20 min | Ordem de serviço | Abre uma OS com reclamação e previsão; adiciona dois serviços e duas peças; corrige uma quantidade; remove uma peça e vê o estoque voltar |
| 10 min | Orçamento e entrega | Envia o orçamento pelo WhatsApp (para o próprio celular); preenche as informações ao cliente; encerra a OS; baixa e imprime a nota de entrega |
| 10 min | Situações do dia a dia | Tenta adicionar peça sem estoque; cancela uma OS; reabre uma OS encerrada; tira dúvidas |

**Pontos para reforçar com a equipe:**

1. A **reclamação do cliente** é o que ele relatou, com as palavras dele.
2. As **informações ao cliente** saem impressas: nada de anotação interna ali.
3. A peça sai do estoque assim que entra na OS.
4. O orçamento pelo WhatsApp é a autorização do cliente: só começar o serviço
   depois da resposta.
5. A senha é pessoal.

## Sessão 2: gestão (só o proprietário, ~30 min)

| Tempo | Tema | O que faz |
|---|---|---|
| 8 min | Pagamentos | Registra um pagamento parcial em Pix e completa no débito; estorna um pagamento; confere "A receber" |
| 8 min | Financeiro | Lança o aluguel como despesa; confere os cards, "Recebido por forma" e "Despesas por categoria"; estorna um lançamento; usa "Ocultar valores" |
| 6 min | Relatórios | Gera o resumo financeiro do mês; exporta em PDF e em CSV |
| 5 min | Equipe | Cria um membro, redefine a senha dele, desativa e reativa |
| 3 min | LGPD | Vê onde fica "Remover dados pessoais" no perfil do cliente e quando usar |

**Pontos para reforçar com o proprietário:**

1. O pagamento é registrado **depois** de encerrar a OS.
2. Conferir no fim do dia o "Recebido por forma de pagamento" com o banco e a
   maquininha.
3. Quando alguém sair da oficina, **desativar** a conta no mesmo dia.
4. Remover dados de cliente não tem volta: só quando o cliente pedir.

## Checklist de conclusão

Considere o treinamento concluído quando cada pessoa conseguir, sozinha:

**Funcionários**

- [ ] Entrar no sistema e trocar a senha
- [ ] Cadastrar cliente e veículo
- [ ] Abrir uma OS completa, com serviços e peças
- [ ] Enviar o orçamento pelo WhatsApp
- [ ] Encerrar a OS e imprimir a nota de entrega

**Proprietário** (além dos itens acima)

- [ ] Registrar e estornar um pagamento
- [ ] Lançar uma despesa com categoria
- [ ] Gerar e exportar um relatório
- [ ] Criar um membro e redefinir a senha dele

## Depois do treinamento

1. Zerar o banco de produção e criar a conta real do proprietário (seção
   "Depois do teste" do [Plano de testes](PLANO_DE_TESTES.md)).
2. Começar o **uso piloto**: alguns dias usando o AutOS em paralelo ao papel.
3. Anotar as dúvidas e os incômodos que aparecerem; eles viram ajustes ou
   entram no manual.

| Data | Quem | Dúvida ou incômodo | Resolvido? |
|---|---|---|---|
| | | | |
| | | | |
