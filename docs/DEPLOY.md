# Deploy em produção

Como o AutOS roda em produção e como colocar uma versão nova no ar.

| Parte | Onde | Plano |
|---|---|---|
| Frontend (React) | Vercel | gratuito |
| Backend (API) | Render, Web Service | gratuito (dorme após 15 min sem uso) |
| Banco (PostgreSQL) | Neon | gratuito |

> Nunca coloque senhas, `DATABASE_URL` ou `JWT_SECRET` em código, commit,
> issue ou chat. Elas ficam só nos painéis da Vercel, do Render e no `.env`
> local.

## 1. Banco no Neon

1. Crie um projeto no [Neon](https://neon.tech) na região **mais perto do
   backend no Render** (a região do Render aparece no topo do serviço). Em
   produção usamos **AWS US East 1 (N. Virginia)**, junto do Render em Virginia;
   se o Render estiver em Oregon, prefira AWS US West. Não vale usar São Paulo:
   o Render não tem servidor no Brasil, e cada tela faz várias consultas ao
   banco, então a distância entre backend e banco pesaria em todo clique.
2. Em **Connection Details**, copie a connection string **sem pooling**
   (desmarque "Connection pooling"). Ela termina com `?sslmode=require`.
   Essa é a `DATABASE_URL` de produção.
3. Crie as tabelas, do seu computador, na pasta `backend`:
   ```bash
   DATABASE_URL="<connection string do Neon>" npx prisma migrate deploy
   ```
   No PowerShell: `$env:DATABASE_URL="<...>"; npx prisma migrate deploy`.

   No CMD do Windows são dois comandos (as aspas em volta de tudo protegem o
   `&` que a string do Neon costuma ter):
   ```cmd
   set "DATABASE_URL=<connection string do Neon>"
   npx prisma migrate deploy
   ```

   > **Cuidado:** no PowerShell e no CMD a variável continua valendo no
   > terminal até ele ser fechado, e tem prioridade sobre o `.env`. Use um
   > terminal só para os comandos de produção e feche-o ao terminar; senão um
   > `npm run dev` ou `npm test` nele vai usar o banco de produção.

## 2. Backend no Render

No Web Service do backend:

**Settings**

| Campo | Valor |
|---|---|
| Root Directory | `backend` |
| Build Command | `npm install && npx prisma migrate deploy && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/health` |

O `prisma migrate deploy` no build aplica sozinho as migrations novas a cada
deploy, então não é preciso rodar à mão nas próximas versões.

**Environment**

| Variável | Valor |
|---|---|
| `DATABASE_URL` | Connection string do Neon (passo 1.2) |
| `JWT_SECRET` | Texto aleatório e longo, **novo** (gere com o comando abaixo) |
| `JWT_EXPIRES_IN` | `8h` |
| `CORS_ORIGIN` | `https://autos-project.vercel.app` (sem barra no final) |

Para gerar o `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

Depois de salvar, faça **Manual Deploy → Deploy latest commit** e confira nos
logs a linha "Conectado ao banco de dados PostgreSQL". Abra
`https://<seu-backend>.onrender.com/health`: deve responder `{"status":"ok"}`.

> **Plano gratuito:** o backend dorme depois de 15 minutos sem uso, e o primeiro
> acesso seguinte leva de 30 a 50 segundos. Para a oficina, isso acontece na
> primeira tela do dia. Se incomodar, o plano Starter (pago) deixa sempre
> ligado, sem mudar nada no código.

## 3. Frontend na Vercel

No projeto da Vercel:

| Campo | Valor |
|---|---|
| Root Directory | `frontend` |
| Framework Preset | Vite |
| Variável `VITE_API_URL` | `https://<seu-backend>.onrender.com/api` |

O arquivo `frontend/vercel.json` faz o F5 funcionar em qualquer página (sem ele,
recarregar `/ordens-servico/12` daria 404).

Depois de mudar a variável, faça **Redeploy** (as variáveis `VITE_` entram no
build).

## 4. Conta do proprietário

Na pasta `backend`, com a `DATABASE_URL` de produção:
```bash
DATABASE_URL="<connection string do Neon>" npm run criar-proprietario -- email@dono.com "Nome do Dono"
```
O comando mostra uma senha provisória. Entregue ao proprietário pessoalmente:
ele troca no primeiro acesso.

## 5. Conferência

Siga o [Plano de testes de aceitação](PLANO_DE_TESTES.md). Ele termina com o
passo de **zerar o banco** (os dados do teste são falsos) e criar a conta real do
proprietário.

## 6. Backup

O plano gratuito do Neon guarda só algumas horas de histórico, então o backup é
feito por nós. **Uma vez por semana** (e antes de qualquer mudança grande):

```bash
cd backend
DATABASE_URL="<connection string do Neon>" npm run backup
```

- O arquivo vai para `backend/backups/autos-AAAA-MM-DD-HH-MM.dump`. A pasta
  fica fora do git, porque o backup tem dados de clientes.
- Guarde uma cópia **fora do computador** (pendrive ou nuvem pessoal) e mantenha
  as últimas 4 semanas.
- O script usa o `pg_dump` da instalação do PostgreSQL. No Windows ele acha
  sozinho em `C:\Program Files\PostgreSQL\<versão>\bin`; em outro lugar, informe
  o caminho em `PG_DUMP`.

**Restaurar** (num banco vazio, de preferência um de teste primeiro):
```bash
"C:\Program Files\PostgreSQL\18\bin\pg_restore" --no-owner --no-privileges -d "<connection string do banco de destino>" backups/autos-AAAA-MM-DD-HH-MM.dump
```

## Versões novas

1. Merge na `main`: a Vercel e o Render fazem o deploy sozinhos (as migrations
   rodam no build do Render).
2. Antes de uma migration que mexe em dados, faça um backup.
3. Confira `/health` e as telas principais.
