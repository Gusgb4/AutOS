# API do AutOS

Referência dos endpoints do backend (Express + Prisma). Todas as rotas ficam
sob o prefixo `/api`.

## Convenções

- **Autenticação:** todas as rotas, menos `POST /api/auth/login`, exigem o
  cabeçalho `Authorization: Bearer <token>`. O token é um JWT gerado no login e
  expira conforme `JWT_EXPIRES_IN` (padrão: 8 horas).
- **Perfis:** `PROPRIETARIO` e `FUNCIONARIO`. Nas tabelas abaixo, **Dono** indica
  rota exclusiva do proprietário (responde `403` para funcionário).
- **Datas:** sempre no formato `AAAA-MM-DD` e no fuso de Brasília. Períodos
  (`inicio`/`fim`) incluem o dia final inteiro.
- **Valores em dinheiro:** chegam como texto (`"150.00"`), por causa do tipo
  Decimal do banco.
- **Erros:** respostas de erro têm o formato `{ "erro": "mensagem" }`.

| Código | Quando |
|---|---|
| 400 | Dados inválidos (validação com Zod) |
| 401 | Sem token, token inválido ou expirado |
| 403 | Perfil sem permissão para a rota |
| 404 | Registro não encontrado |
| 409 | Conflito com uma regra de negócio (ex.: pagar OS não finalizada) |
| 429 | Muitas tentativas de login (10 a cada 15 minutos por IP) |

## Autenticação (`/api/auth`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| POST | `/login` | público | Recebe `{ email, senha }` e devolve `{ token, user }`. Toda tentativa fica no registro de acesso |
| GET | `/me` | todos | Dados do usuário logado |
| PATCH | `/senha` | todos | Troca a senha: `{ senha_atual, nova_senha }` (mínimo 6 caracteres) |

## Usuários e equipe (`/api/users`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/` | todos | Lista os usuários agrupados por perfil (usado na escolha do mecânico da OS) |
| POST | `/` | Dono | Cria um membro com senha provisória |
| PATCH | `/:id/redefinir-senha` | Dono | Gera uma nova senha provisória |
| PATCH | `/:id/deactivate` | Dono | Desativa o acesso (o histórico continua) |
| PATCH | `/:id/activate` | Dono | Reativa o acesso |
| GET | `/produtividade?mes=AAAA-MM` | Dono | OS finalizadas e faturamento por mecânico no mês |

## Clientes (`/api/clients`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/?busca=&arquivados=true` | todos | Busca por nome ou placa. Sem `arquivados`, só os ativos |
| POST | `/` | todos | Cadastra: `{ nome, telefone, documento?, email?, endereco? }` |
| GET | `/:id` | todos | Cliente com os veículos ativos |
| PUT | `/:id` | Dono | Edita os dados |
| PATCH | `/:id/archive` | Dono | Arquiva |
| PATCH | `/:id/unarchive` | Dono | Desarquiva |
| POST | `/:id/anonimizar` | Dono | **LGPD:** apaga nome, telefone, documento, e-mail, endereço e placas, mantendo OS e financeiro. Recusa (`409`) com OS em aberto ou valor a receber. Não tem volta |

## Veículos (`/api/vehicles`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/?placa=` | todos | Busca por placa |
| GET | `/:id` | todos | Veículo com cliente e lembretes |
| POST | `/` | todos | Cadastra: `{ cliente_id, placa, marca, modelo, ano, cor?, quilometragem_atual?, lembretes? }`. Cada lembrete: `{ nome, intervalo_dias, intervalo_km }` (até 10; vence pelo que chegar primeiro) |
| PUT | `/:id` | Dono | Edita. `lembretes`, quando enviado, substitui a lista: os sem `id` são criados, os que sumiram são apagados e os existentes só recalculam a agenda se o intervalo mudar |
| PATCH | `/:id/archive` | Dono | Arquiva |
| PATCH | `/:id/unarchive` | Dono | Desarquiva |

Cliente anonimizado fica travado: editar, desarquivar ou cadastrar veículo nele responde `409`.

## Estoque (`/api/stock`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/?lowStockOnly=true&incluirArquivados=true` | todos | Lista os itens; filtros opcionais |
| GET | `/:id` | todos | Um item |
| POST | `/` | Dono | Cadastra um item (com preço de venda e de custo) |
| PUT | `/:id` | Dono | Edita |
| DELETE | `/:id` | Dono | Exclui item que nunca foi usado em OS |
| PATCH | `/:id/archive` | Dono | Arquiva item já usado em OS |
| PATCH | `/:id/unarchive` | Dono | Desarquiva |

## Ordens de serviço (`/api/service-orders`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/?status=&cliente_id=&status_pagamento=` | todos | Lista com filtros opcionais |
| GET | `/:id` | todos | OS completa (o custo e a margem das peças só vêm para o dono) |
| POST | `/` | todos | Abre: `{ cliente_id, veiculo_id, mecanico_id, quilometragem_registrada?, reclamacao?, previsao_entrega?, observacoes? }` |
| PATCH | `/:id/status` | todos | Muda o status: `{ status }`. Transições permitidas: ABERTA → EM_ANDAMENTO ou CANCELADA; EM_ANDAMENTO → FINALIZADA ou CANCELADA; FINALIZADA → EM_ANDAMENTO (reabrir). Cancelar com pagamento ativo responde `409`. Ao finalizar, `lembretes_feitos` (ids dos lembretes do veículo) reinicia a contagem só desses lembretes |
| PATCH | `/:id/detalhes` | todos | Reclamação, previsão de entrega e informações ao cliente. Só os campos enviados mudam; `""` apaga |
| POST | `/:id/services` | todos | Adiciona um serviço: `{ descricao, valor }` |
| DELETE | `/:id/services/:serviceId` | todos | Remove um serviço |
| POST | `/:id/parts` | todos | Adiciona uma peça do estoque (baixa o estoque) |
| DELETE | `/:id/parts/:partId` | todos | Remove a peça (devolve ao estoque) |
| GET | `/:id/pagamentos` | todos | Pagamentos da OS |
| POST | `/:id/pagamentos` | Dono | Registra pagamento de OS finalizada: `{ valor, forma_pagamento, data? }`. Formas: `PIX`, `DINHEIRO`, `DEBITO`, `CREDITO`, `OUTRO` |
| PATCH | `/:id/pagamentos/:pagamentoId/estornar` | Dono | Estorna um pagamento (o valor volta ao saldo) |

O valor total da OS é recalculado a cada serviço ou peça. O status de pagamento
(`PENDENTE`, `PARCIAL`, `PAGO`) é calculado a partir dos pagamentos não estornados.

## Financeiro (`/api/financial`) (só o dono)

| Método | Rota | Descrição |
|---|---|---|
| GET | `/?tipo=&categoria=&forma=&inicio=&fim=&estornados=true` | Lançamentos. Por padrão, só os não estornados |
| POST | `/` | Lançamento manual: `{ tipo, descricao, valor, data?, categoria? }`. Categoria obrigatória em despesa (`ALUGUEL`, `SALARIO`, `PECAS`, `ENERGIA`, `OUTROS`) |
| PATCH | `/:id/estornar` | Estorna um lançamento manual (pagamento de OS é estornado pela OS) |
| GET | `/a-receber` | OS finalizadas com saldo em aberto |
| GET | `/resumo?inicio=&fim=` | Entradas, saídas e saldo comparados com o período anterior, despesas por categoria e recebido por forma de pagamento. Sem datas: mês atual |

## Relatórios (`/api/reports`) (só o dono)

Todos recebem `?inicio=AAAA-MM-DD&fim=AAAA-MM-DD`. Para comparar com outro
período, envie também `comparar_inicio` e `comparar_fim` (os dois juntos); sem
eles, a comparação é com o período anterior de mesma duração.

| Método | Rota | Descrição |
|---|---|---|
| GET | `/sales` | Vendas: faturamento, OS finalizadas, ticket médio e vendas por dia |
| GET | `/inventory` | Inventário: consumo de peças, posição do estoque e previsão de falta |
| GET | `/financial-summary` | Caixa, recebido por forma, faturamento (mão de obra × peças) e margem das peças |
| GET | `/client-activity` | Clientes atendidos, clientes novos e ranking |

## Notificações (`/api/notificacoes`)

| Método | Rota | Perfil | Descrição |
|---|---|---|---|
| GET | `/` | todos | Avisos do sino: um por lembrete vencido ou próximo (até 7 dias ou 500 km), com o nome do lembrete, estoque abaixo do mínimo e, para o dono, pagamento atrasado (OS finalizada há mais de 15 dias com saldo) |
