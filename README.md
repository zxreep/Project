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
npm run prisma:generate
```

Fill `.env` values:
- `BOT_TOKEN`: Telegram bot token from BotFather
- `DATABASE_URL`: Neon Postgres connection string
- `SUPERADMIN_ID`: Telegram user id for superadmin access
- `LOG_GROUP_ID`: Telegram group/channel id for audit logs
- `PORT`: HTTP port for `/health` (Render sets this automatically)

## 2) Run locally

```bash
npm run dev
```

## Core Commands

- `/start [token]`: onboarding + optional referral assignment
- `/prompt <userid>`: superadmin-only promotion to admin
- `/referral`: get/generate your referral link (admins/superadmins)
- `/my_referrals`: total referred users count
- `/my_users`: list users assigned to you

## Referral System

- Every admin/superadmin gets a unique referral link:
  - `https://t.me/<bot_username>?start=<token>`
- Token is secure random and unique, stored in `ReferralToken` table.
- On `/start <token>`:
  - token resolves to admin
  - user is assigned via `referredById`
  - self-referral is blocked
  - repeated same referral clicks are ignored
  - if user already belongs to another admin, assignment is changed to the new admin (as requested)

## Superadmin Panel

When superadmin sends `/start`, bot shows:
- `CHECK USERS`
- `CHECK ADMINS`

## Group Logging

The bot sends event logs to `LOG_GROUP_ID`, including:
- incoming updates
- start/promotion/referral events
- superadmin panel actions
- failed operations

## Health endpoint

- `GET /health` returns JSON indicating the process is alive.

## Deploy to Render

This repo includes `render.yaml` for a **web** service with `healthCheckPath: /health`.
