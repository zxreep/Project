# Smart Quiz Telegram Bot (Render + Neon + Prisma)

Starter template for a Telegram bot using:
- Node.js + TypeScript
- grammY (Telegram framework)
- Prisma ORM + Neon PostgreSQL
- Render deployment configuration

## 1) Setup

```bash
npm install
cp .env.example .env
```

Fill `.env` values:
- `BOT_TOKEN`: Telegram bot token from BotFather
- `DATABASE_URL`: Neon Postgres connection string

## 2) Generate Prisma client

```bash
npm run prisma:generate
```

(Optional) Create/apply schema in DB:

```bash
npm run prisma:push
```

## 3) Run locally

```bash
npm run dev
```

When a user sends `/start`, the bot replies with the Smart Quiz welcome message.

## 4) Deploy to Render

This repo includes `render.yaml` for a worker service (long polling).

Render steps:
1. Create a new **Blueprint** on Render and point to this repository.
2. Set environment variables in Render dashboard:
   - `BOT_TOKEN`
   - `DATABASE_URL`
3. Deploy.

## Project Structure

```text
.
├─ prisma/
│  └─ schema.prisma
├─ src/
│  ├─ bot/
│  │  └─ index.ts
│  ├─ config/
│  │  └─ env.ts
│  ├─ db/
│  │  └─ prisma.ts
│  ├─ handlers/
│  │  └─ start.ts
│  ├─ types/
│  │  └─ bot.ts
│  └─ index.ts
├─ .env.example
├─ render.yaml
├─ package.json
└─ tsconfig.json
```
