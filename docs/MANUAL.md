# Manual do usuário · AutOS

Guia para quem usa o AutOS no dia a dia da oficina: o proprietário e os
funcionários. Cada seção explica uma tarefa, passo a passo, com os nomes que
aparecem na tela.

As partes marcadas com **(só proprietário)** não aparecem para funcionários.

## 1. Entrando no sistema

1. Acesse o endereço do AutOS no navegador do computador ou do celular.
2. Digite seu e-mail e senha e clique em **Continue para o Menu**.
3. **No primeiro acesso**, o sistema pede para trocar a senha provisória por uma
   sua. Escolha uma senha com pelo menos 6 caracteres e não compartilhe com
   ninguém.

Para trocar a senha depois, use **Alterar senha**, no menu lateral. Para sair,
clique em **Sair**.

> Errou a senha várias vezes? Depois de 10 tentativas, o login fica bloqueado
> por 15 minutos. Esqueceu a senha? Peça ao proprietário para redefinir.

## 2. O menu

| Menu | Para que serve |
|---|---|
| **Início** | Visão geral do dia: ordens de serviço e avisos |
| **Ordens de Serviço** | Abrir, acompanhar e encerrar os serviços |
| **Clientes** | Cadastro de clientes e veículos |
| **Estoque** | Peças e materiais |
| **Financeiro** (só proprietário) | Pagamentos, despesas e contas a receber |
| **Relatórios** (só proprietário) | Vendas, estoque, resumo financeiro e clientes |
| **Equipe** (só proprietário) | Contas dos funcionários e produtividade |

O **sino** no topo mostra os avisos: revisões vencidas ou chegando, peças
abaixo do estoque mínimo e, para o proprietário, pagamentos atrasados.

## 3. Clientes e veículos

**Cadastrar um cliente**

1. Abra **Clientes** e clique em **Adicionar Cliente**.
2. Preencha nome e telefone (obrigatórios). E-mail, CPF/CNPJ e endereço são
   opcionais: cadastre só o que for usar.

**Cadastrar um veículo**

1. Abra o perfil do cliente (clique no nome dele na lista).
2. Em **Veículos**, clique em **Adicionar veículo**.
3. Preencha marca, modelo, placa, ano, cor (opcional) e a quilometragem atual.
4. **Lembretes de manutenção** (opcional): clique numa sugestão (Troca de
   óleo, Correia dentada, Revisão geral...) ou em **Outro**, e ajuste de quantos
   em quantos dias e km o serviço deve ser repetido. Um carro pode ter vários
   lembretes. Quando um deles chegar perto, o aviso aparece no sino, com um
   botão para chamar o cliente no WhatsApp.

**Buscar:** na lista de clientes, digite o nome ou a placa.

## 4. Ordem de serviço (OS)

### 4.1 Abrir a OS (quando o carro chega)

1. Abra **Ordens de Serviço** e clique em **Nova Ordem**.
2. Escolha o **cliente**, o **veículo** e o **mecânico responsável**.
3. Confira a **quilometragem** (já vem a última registrada; corrija se o painel
   marcar mais).
4. Se souber, preencha a **previsão de entrega**.
5. Em **Reclamação do cliente**, escreva o que o cliente contou, com as palavras
   dele. Ex.: "barulho ao frear". Não precisa ser o diagnóstico.
6. Clique em **Abrir Ordem de Serviço**.

### 4.2 Serviços e peças

Na própria tela da OS:

- **Serviço:** escreva a descrição e o valor e clique em **Adicionar**.
- **Peça:** escolha a peça do estoque e a quantidade e clique em **Adicionar**.
  A peça sai do estoque na hora. Se não tiver quantidade suficiente, o sistema
  avisa.

O **valor total** da OS é somado sozinho. Para corrigir uma quantidade ou um
valor, edite direto na linha. Para tirar, use a lixeira (a peça volta para o
estoque).

> Peça que o cliente trouxe não entra na tabela de peças (ela não é do
> estoque). Se quiser registrar, escreva em **Informações ao cliente**.

### 4.3 Mandar o orçamento

Clique em **Enviar por WhatsApp**. O WhatsApp abre com a mensagem pronta para o
cliente: veículo, serviços, peças, total e o pedido de autorização. Quando o
cliente responder, a conversa fica como registro de que ele autorizou.

Também dá para baixar o orçamento em PDF, em **Baixar PDF**.

### 4.4 Detalhes do atendimento

Na seção **Detalhes do atendimento** você pode, a qualquer momento antes de
encerrar:

- ajustar a **reclamação do cliente**;
- mudar a **previsão de entrega**;
- escrever **informações ao cliente**: recomendações e avisos, como "trocar os
  pneus nos próximos 3 meses".

Clique em **Salvar** para gravar ou em **Descartar** para voltar ao que estava.

> **Atenção:** as informações ao cliente saem impressas na nota e na mensagem.
> Não escreva ali nada que o cliente não deva ler.

### 4.5 Encerrar e entregar

1. Se o carro tem lembretes, a seção **Lembretes do veículo** aparece na OS.
   Marque o que foi feito nesta OS (por exemplo, a troca de óleo): só os
   marcados recomeçam a contagem.
2. Com o serviço pronto, clique em **Encerrar OS** e confirme.
3. Clique em **Baixar PDF**: sai a **Nota de entrega**, em uma página, com o que
   foi feito, os valores e o espaço para as assinaturas.
4. Imprima e entregue ao cliente quando ele vier buscar o carro.
5. Se quiser avisar pelo WhatsApp, **Enviar por WhatsApp** agora manda "Seu
   veículo está pronto!".

**Errou algo depois de encerrar?** Use **Reabrir OS**, corrija e encerre de
novo. Os pagamentos já registrados continuam valendo.

**O cliente desistiu?** Use **Cancelar OS** (antes de encerrar). OS cancelada
não gera PDF.

## 5. Pagamentos (só proprietário)

O pagamento é registrado **depois de encerrar a OS**, na seção **Pagamentos** da
própria OS (antes disso, ela mostra um aviso).

1. Escolha a **forma de pagamento**: Pix, Dinheiro, Débito, Crédito ou Outro.
2. Confira o **valor** (já vem o que falta pagar) e a **data**.
3. Clique em **Registrar**.

O cliente pode pagar em partes: a OS fica como **Parcial** até completar e
depois como **Pago**. Registrou errado? Use o botão de estorno ao lado do
pagamento e registre de novo.

> OS com pagamento registrado não pode ser cancelada. Estorne o pagamento antes.

## 6. Estoque

- Veja as peças, a quantidade, o preço e os avisos de **estoque baixo** e de
  **previsão de falta**.
- **(só proprietário)** **Adicionar Item**: nome, quantidade, quantidade mínima,
  preço de venda e preço de custo. O custo é usado para calcular a margem.
- Peça que já foi usada em alguma OS não pode ser excluída, só **arquivada**
  (assim o histórico das OS continua certo).

## 7. Financeiro (só proprietário)

- **Cards do topo:** receitas, despesas e saldo. Abrem no mês atual; em
  **Período** dá para ver o mês passado ou escolher as datas, e em **Comparar
  com** escolher a base (período anterior, ano passado ou datas à mão). Os
  filtros de data da lista de lançamentos valem só para a lista.
- **Recebido por forma de pagamento:** útil para conferir com o extrato do banco
  e da maquininha.
- **Despesas por categoria:** onde o dinheiro está indo.
- **A receber:** OS encerradas que ainda têm valor em aberto.
- **Lançamentos:** clique em **Novo Lançamento** para registrar uma despesa
  (escolha a categoria: aluguel, salário, peças, energia ou outros) ou uma
  receita fora das OS.
- Lançou errado? Use **Estornar** na linha e lance de novo. O lançamento
  estornado continua no histórico (marque **Mostrar estornados** para vê-lo).
- **Ocultar valores** esconde os números da tela, para quando houver alguém por
  perto.

## 8. Relatórios (só proprietário)

Escolha o relatório e o período (ou use os atalhos):

- **Vendas:** faturamento, quantidade de OS e ticket médio.
- **Inventário:** peças mais usadas, posição do estoque e previsão de falta.
- **Resumo financeiro:** caixa, recebido por forma, mão de obra × peças e margem.
- **Atividade do cliente:** clientes atendidos, novos e os que mais gastaram.

Cada relatório abre com gráficos (faturamento ao longo do período, peças e
clientes que mais renderam, entradas × saídas, mão de obra × peças) e, embaixo,
as tabelas completas.

Em **Comparar com**, escolha a base da comparação: o **período anterior**, o
**mesmo período do ano passado** ou **datas escolhidas** à mão. Todos podem ser
baixados em **CSV** (abre no Excel) ou **PDF**.

## 9. Equipe (só proprietário)

- **Novo membro:** nome, e-mail e perfil (proprietário ou funcionário). O sistema
  gera uma **senha provisória**: copie e entregue à pessoa. Ela troca no
  primeiro acesso.
- **Redefinir senha:** quando alguém esquecer a senha. Gera uma nova provisória.
- **Desativar:** quando alguém sair da oficina. O histórico das OS dessa pessoa
  continua, e dá para **Reativar** depois.
- **Produtividade:** OS encerradas e valores por mecânico no mês.

## 10. Quando o cliente pede para apagar os dados (só proprietário)

Pela LGPD, o cliente pode pedir que a oficina apague os dados dele.

1. Abra o perfil do cliente.
2. No fim da página, em **Remover dados pessoais (LGPD)**, clique em
   **Remover dados**.
3. Digite **REMOVER** e confirme.

São apagados nome, telefone, documento, e-mail, endereço e as placas. As OS e os
valores continuam no sistema, mas como "Cliente removido". **Não tem volta.**

O sistema não deixa remover enquanto houver OS em aberto ou valor a receber.
Antes de remover, confira também se as **informações ao cliente** das OS dele
não têm dados pessoais escritos à mão.

## 11. Dúvidas comuns

**O sistema demora para abrir de manhã.**
Na primeira vez do dia, o servidor pode levar até um minuto para "acordar".
Depois disso, fica rápido.

**Não aparece onde registrar o pagamento.**
O pagamento só pode ser registrado depois de clicar em **Encerrar OS**.

**A peça não entra na OS.**
Provavelmente não há quantidade suficiente no estoque. Atualize o estoque
(proprietário) e tente de novo.

**Lancei uma despesa errada.**
Estorne o lançamento e lance de novo com os dados certos.

**Esqueci a senha.**
Peça ao proprietário para usar **Redefinir senha** na tela de Equipe. Se o
proprietário esqueceu a senha dele, quem cuida do sistema consegue gerar uma
nova (veja o README).

**Onde estão as regras de uso e de privacidade?**
Na tela de login, nos links **Termos de Serviço** e **Política de Privacidade**.
