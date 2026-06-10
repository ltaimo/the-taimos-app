# The Taimo's App

**by Jasvania & Layton**

Aplicação mobile-first de gestão da vida familiar: finanças, lembretes, compras e necessidades, objetivos e programas, com dados partilhados pela família.

## Stack

- Frontend: React, Vite e TypeScript
- Backend: NestJS, TypeScript e Prisma
- Base de dados e autenticação: Supabase (PostgreSQL + Auth)
- Deploy: Vercel (frontend) e Render (backend)

## Módulos

- Início com visão da vida familiar e resumo financeiro
- Lembretes partilhados, prioridade, prazo e responsável
- Compras e necessidades com loja, preço estimado e data necessária
- Programas familiares com data, local, anfitrião e lembrete
- Movimentos, despesas fixas, orçamento, poupança e relatórios
- Convite para os dois membros usarem os mesmos dados da família

Os assets oficiais da marca estão em `frontend/public`, incluindo o logo completo, símbolo compacto, favicon, ícones de instalação móvel e manifest.

## Estrutura

```text
frontend/   Interface React
backend/    API REST NestJS e schema Prisma
render.yaml Blueprint do Render
```

## Pré-requisitos

- Node.js 22+
- Um projeto no Supabase
- npm 10+

## Configurar o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings > Database**, copie a connection string com pooler para `DATABASE_URL` e a ligação direta para `DIRECT_URL`.
3. Em **Project Settings > API**, copie a URL, a chave `anon` e a chave `service_role`.
4. Em **Authentication > URL Configuration**, adicione `http://localhost:5173` e o domínio final da Vercel aos Redirect URLs.
5. Mantenha a confirmação de email ativa ou desative-a durante testes locais. Ambos os fluxos são suportados.

## Setup local

Na raiz:

```bash
copy .env.example .env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

O frontend abre em `http://localhost:5173` e a API em `http://localhost:3000/api`.

O Vite lê variáveis apenas a partir da pasta `frontend`. Crie também `frontend/.env.local`:

```env
VITE_API_URL=http://localhost:3000/api
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

Crie `backend/.env` com:

```env
DATABASE_URL=...
DIRECT_URL=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
JWT_SECRET=uma-chave-longa-e-aleatoria
FRONTEND_URL=http://localhost:5173
```

## Base de dados

Para desenvolvimento:

```bash
npm run db:migrate
npm run db:seed
```

Para criar uma migration para produção:

```bash
cd backend
npx prisma migrate dev --name initial
```

Confirme a pasta `backend/prisma/migrations` no Git. No Render, `prisma migrate deploy` é executado no arranque.

## Deploy do backend no Render

1. Envie o repositório para o GitHub.
2. No Render, escolha **New > Blueprint** e selecione o repositório. O `render.yaml` configura o serviço.
3. Preencha `DATABASE_URL`, `DIRECT_URL`, `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` e `FRONTEND_URL`.
4. Depois do primeiro deploy, execute no Shell do Render:

```bash
npm run prisma:seed
```

O health check fica em `https://SEU-SERVICO.onrender.com/api/health`.

## Deploy do frontend na Vercel

1. Importe o mesmo repositório na Vercel.
2. Defina **Root Directory** como `frontend`.
3. Configure:

```env
VITE_API_URL=https://SEU-SERVICO.onrender.com/api
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_ANON_KEY=SUA_CHAVE_ANON
```

4. Faça deploy e atualize `FRONTEND_URL` no Render com o domínio da Vercel.

## Segurança

- O frontend envia o access token do Supabase em cada pedido.
- A API valida o token diretamente no Supabase.
- O `householdId` é obtido no backend através do utilizador autenticado.
- Consultas e alterações financeiras são sempre filtradas pelo household.
- Nunca exponha `SUPABASE_SERVICE_ROLE_KEY` no frontend.

## Comandos

```bash
npm run dev       # frontend e backend
npm run build     # build completo
npm run lint      # lint completo
npm run db:seed   # categorias padrão
```
