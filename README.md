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
- `SUPERADMIN_ID`: Telegram user id for superadmin access
- `PORT`: HTTP port for `/health` (Render sets this automatically)

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

## Commands

- `/start`: saves/updates user in database and sends welcome message with role (`user`, `admin`, `superadmin`).
- `/prompt <userid>`: superadmin-only command to promote a user to admin.

## Health endpoint

- `GET /health` returns JSON indicating the process is alive.
- Useful for Render health checks and uptime probes.

## Logging / Debugging

The bot writes structured JSON logs for:
- startup/shutdown lifecycle
- database connection state
- prisma schema sync (`prisma db push`) output
- every incoming Telegram update
- command success/failures
- unhandled exceptions and promise rejections
- grammY API/network/runtime errors

## 4) Deploy to Render

This repo includes `render.yaml` for a **web** service.

Render steps:
1. Create a new **Blueprint** on Render and point to this repository.
2. Set environment variables in Render dashboard:
   - `BOT_TOKEN`
   - `DATABASE_URL`
   - `SUPERADMIN_ID`
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
│  │  ├─ prompt.ts
│  │  └─ start.ts
│  ├─ services/
│  │  └─ userRole.ts
│  ├─ types/
│  │  └─ bot.ts
│  ├─ utils/
│  │  └─ logger.ts
│  └─ index.ts
├─ .env.example
├─ render.yaml
├─ package.json
└─ tsconfig.json
```
