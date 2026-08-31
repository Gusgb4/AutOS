# AutOS - Sistema de Gestão para Oficina Mecânica

Sistema web para gerenciar clientes, veículos, estoque e ordens de serviço de
uma oficina mecânica, acessível de qualquer lugar, sem instalação local.

Projeto de extensão universitária (PAC Extensionista VI) — Engenharia de Software,
Centro Universitário Católica de Santa Catarina.

🔗 **Aplicação:** https://autos-project.vercel.app

## Funcionalidades (MVP1)

- Autenticação com dois perfis (proprietário e funcionário), com permissões distintas
- Clientes e veículos: cadastro, edição, exclusão, busca por nome ou placa
- Estoque de peças, com alerta de quantidade mínima
- Ordens de serviço completas: abertura, serviços e peças (com baixa automática de
  estoque), cálculo automático do valor total, observações, encerramento,
  reabertura e cancelamento
- Envio de orçamento por WhatsApp

Financeiro, relatórios e lembretes de manutenção fazem parte do MVP2.

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

## Equipe

Adrian Marcio Roth · Daniela Luisa da Conceição · Gustavo Franz ·
João Henrique Souza Rocha · Leonardo André Ferreira · Marcelo Gustavo Eger ·
Willian Squena

Orientação: Prof. Edson Vaz Lopes — PAC Extensionista VI

## Roadmap

- ✅ **MVP1** — núcleo operacional (esta entrega)
- 🔜 **MVP2** (setembro/2026) — financeiro, relatórios, lembretes de manutenção
- 🔜 **MVP3** (outubro/2026) — responsividade mobile, polimento final

## Licença

Projeto acadêmico, sem licença de uso público definida.
