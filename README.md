# AutOS - Sistema de Gestão para Oficina Mecânica

Sistema web para gerenciar clientes, veículos, estoque, ordens de serviço,
financeiro e relatórios de uma oficina mecânica, acessível de qualquer lugar,
sem instalação local.

Projeto de extensão universitária (PAC Extensionista VI) — Engenharia de Software,
Centro Universitário Católica de Santa Catarina.

🔗 **Aplicação:** https://autos-project.vercel.app

### Acesso

Não existe cadastro público. A conta do proprietário é criada pela equipe com
uma senha provisória (veja "Criar ou redefinir a conta do proprietário"), e o
proprietário cria as contas dos funcionários. Todos trocam a senha provisória
no primeiro acesso.

Para testar o sistema com acesso completo, use a conta do proprietário enviada
no PDF pelo Gustavo Franz na atividade do Teams.

## Funcionalidades

**Operação (MVP1)**

- Dois perfis (proprietário e funcionário), com permissões verificadas no backend
- Clientes e veículos: cadastro, edição, arquivamento, busca por nome ou placa
- Estoque de peças, com alerta de quantidade mínima
- Ordens de serviço completas: abertura, serviços e peças (com baixa automática de
  estoque), cálculo automático do valor total, observações, encerramento,
  reabertura e cancelamento
- Envio de orçamento por WhatsApp

**Gestão (MVP2 e MVP2.5)**

- Financeiro: lançamentos manuais e dashboard por período (restrito ao proprietário)
- Relatórios: vendas por período (com ticket médio e comparativo), inventário,
  resumo financeiro e atividade do cliente, todos com exportação CSV
- Manutenção: quilometragem do veículo e lembrete de revisão por dias e km
- Clientes: email, endereço, filtros, histórico de OS no perfil e indicador de
  revisão vencida
- Estoque: preço de custo, margem e itens parados
- Equipe: gestão de membros, com ativar e desativar

**Entrega e recebimento (MVP3)**

- Orçamento e nota de entrega em PDF, com a logo da oficina, em uma página
- Orçamento pelo WhatsApp com pedido de autorização; reclamação do cliente,
  previsão de entrega e informações ao cliente na OS
- Pagamentos da OS (parciais, com forma de pagamento e estorno) e contas a receber
- Financeiro com comparativo de período, despesas por categoria e recebido por
  forma de pagamento
- Relatórios em PDF e CSV com comparativo, giro de estoque, previsão de falta e
  produtividade por mecânico
- Notificações: revisões, estoque baixo e pagamentos atrasados
- Senha provisória com troca obrigatória e limite de tentativas de login
- LGPD: remoção de dados do cliente (anonimização), registro de acesso por 6
  meses, Termos de Uso e Política de Privacidade

Tudo o que entrou nesta versão está em [docs/RELEASE_v3.0.md](docs/RELEASE_v3.0.md).

## Documentação

- [Manual do usuário](docs/MANUAL.md)
- [Roteiro de treinamento](docs/TREINAMENTO.md)
- [API (endpoints, perfis e erros)](docs/API.md)
- [Notas da versão 3.0](docs/RELEASE_v3.0.md)
- [Plano de testes de aceitação](docs/PLANO_DE_TESTES.md)

## Stack

React + TypeScript + Tailwind CSS · Node.js + Express + Prisma · PostgreSQL · JWT

## Rodando localmente

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # preencha as variáveis (veja abaixo)
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Variáveis do `backend/.env`:

| Variável | Para que serve |
|---|---|
| `DATABASE_URL` | Conexão com o PostgreSQL |
| `JWT_SECRET` | Chave que assina os tokens de login (texto longo e aleatório) |
| `JWT_EXPIRES_IN` | Validade do login (padrão: `8h`) |
| `PORT` | Porta da API (padrão: `3333`) |
| `CORS_ORIGIN` | Endereço do frontend que pode chamar a API. **Em produção, use a URL da Vercel**; sem ela, qualquer site é aceito |

**Frontend**

```bash
cd frontend
npm install
npm run dev
```

## Criar ou redefinir a conta do proprietário

Na pasta `backend`:

```bash
npm run criar-proprietario -- email@dono.com "Nome do Dono"
```

O script mostra uma senha provisória, que precisa ser trocada no primeiro acesso.
Se o email já existir, a conta vira proprietário ativo e recebe uma nova senha
provisória (é assim que se recupera o acesso se o dono esquecer a senha).

Para criar a conta em produção, rode o mesmo comando com a `DATABASE_URL` do
banco de produção, do mesmo jeito que o `npx prisma migrate deploy`.
## Testes automatizados (backend)

Os testes usam Vitest e Supertest e rodam contra um **banco separado** no
Postgres local. A cada execução esse banco é apagado e recriado com todas as
migrations, então nunca aponte para o banco de desenvolvimento: se o nome do
banco não tiver "test", os testes param antes de apagar qualquer coisa.

```bash
cd backend
cp .env.test.example .env.test   # ajuste usuário e senha do Postgres (banco autos_test)
npm test                         # roda todos os testes
npm run test:coverage            # roda com relatório de cobertura (pasta coverage/)
```

O banco `autos_test` é criado sozinho na primeira execução. Os testes ficam em
`backend/tests/`, e os helpers em `backend/tests/helpers/` criam usuários de
cada perfil (`criarProprietario`, `criarFuncionario`) já com o token deles.

São 87 testes em 8 arquivos: autenticação e perfis, contas de usuário, ordens
de serviço, pagamentos e contas a receber, lançamentos manuais, LGPD e
detalhes da OS.

No frontend, `npm run lint` e `npm run build` (que inclui a checagem de tipos)
devem passar sem erros.

## Equipe

Adrian Marcio Roth · Daniela Luisa da Conceição · Gustavo Franz ·
João Henrique Souza Rocha · Leonardo André Ferreira · Marcelo Gustavo Eger ·
Willian Squena

Orientação: Prof. Edson Vaz Lopes — PAC Extensionista VI

## Roadmap

- ✅ **MVP1** (agosto/2026) — núcleo operacional
- ✅ **MVP2 e MVP2.5** (setembro e outubro/2026) — financeiro, relatórios, manutenção, equipe
- 🔜 **MVP3 / v3.0** (outubro/2026) — entrega e recebimento, LGPD, testes e polimento final

## Licença

Projeto acadêmico, sem licença de uso público definida.
