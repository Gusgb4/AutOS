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

- Financeiro: receita lançada ao finalizar a OS, estorno ao reabrir ou cancelar,
  lançamentos manuais e dashboard por período (restrito ao proprietário)
- Relatórios: vendas por período (com ticket médio e comparativo), inventário,
  resumo financeiro e atividade do cliente, todos com exportação CSV
- Manutenção: quilometragem do veículo e lembrete de revisão por dias e km
- Clientes: email, endereço, filtros, histórico de OS no perfil e indicador de
  revisão vencida
- Estoque: preço de custo, margem e itens parados
- Equipe: gestão de membros, com ativar e desativar

## Stack

React + TypeScript + Tailwind CSS · Node.js + Express + Prisma · PostgreSQL · JWT

## Rodando localmente

**Backend**

```bash
cd backend
npm install
cp .env.example .env      # preencha DATABASE_URL e JWT_SECRET
npx prisma generate
npx prisma migrate deploy
npm run dev
```

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

## Equipe

Adrian Marcio Roth · Daniela Luisa da Conceição · Gustavo Franz ·
João Henrique Souza Rocha · Leonardo André Ferreira · Marcelo Gustavo Eger ·
Willian Squena

Orientação: Prof. Edson Vaz Lopes — PAC Extensionista VI

## Roadmap

- ✅ **MVP1** (agosto/2026) — núcleo operacional
- ✅ **MVP2 e MVP2.5** (setembro e outubro/2026) — financeiro, relatórios, manutenção, equipe
- 🔜 **MVP3** (outubro/2026) — contas a receber, notificações, PDF, testes e polimento final

## Licença

Projeto acadêmico, sem licença de uso público definida.
