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
- `LOG_GROUP_ID`: Telegram group/channel id for audit logs
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

### Promotion behavior

When a user is promoted:
- promoted user receives formatted promotion message
- superadmin receives:
  - `USER <username> (<USERID>)`
  - `Successfully promoted to Admin.`
- user role is updated to `ADMIN` in database

## Group logging

The bot sends event logs to `LOG_GROUP_ID`, including:
- incoming updates
- `/start` success/failure
- `/prompt` success/failure
- unauthorized promotion attempts

## Health endpoint

- `GET /health` returns JSON indicating the process is alive.

## 4) Deploy to Render

This repo includes `render.yaml` for a **web** service.

Render steps:
1. Create a new **Blueprint** on Render and point to this repository.
2. Set environment variables in Render dashboard:
   - `BOT_TOKEN`
   - `DATABASE_URL`
   - `SUPERADMIN_ID`
   - `LOG_GROUP_ID`
3. Deploy.
