import { spawnSync } from "node:child_process";
import http from "node:http";
import { GrammyError, HttpError } from "grammy";
import { createBot } from "./bot";
import { env } from "./config/env";
import { prisma } from "./db/prisma";
import { logger } from "./utils/logger";

function startHealthServer(): http.Server {
  const server = http.createServer((req, res) => {
    if (req.url === "/health") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "ok",
          service: "smart-quiz-telegram-bot",
          timestamp: new Date().toISOString()
        })
      );
      return;
    }

    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Smart Quiz Bot is running. Use /health for health checks.");
  });

  server.listen(env.PORT, () => {
    logger.info("Health server listening", { port: env.PORT });
  });

  return server;
}

function ensurePrismaSchema(): void {
  logger.info("Ensuring Prisma schema exists via db push");

  const result = spawnSync("npx", ["prisma", "db", "push", "--skip-generate"], {
    stdio: "pipe",
    env: process.env,
    encoding: "utf-8"
  });

  if (result.stdout) {
    logger.info("Prisma db push stdout", { output: result.stdout.trim() });
  }

  if (result.stderr) {
    logger.warn("Prisma db push stderr", { output: result.stderr.trim() });
  }

  if (result.status !== 0) {
    throw new Error(`prisma db push failed with status ${result.status}`);
  }
}

async function bootstrap(): Promise<void> {
  logger.info("Bootstrapping bot process");

  startHealthServer();
  ensurePrismaSchema();

  await prisma.$connect();
  logger.info("Database connection established");

  const bot = createBot();

  bot.catch((err) => {
    const ctx = err.ctx;
    const e = err.error;

    if (e instanceof GrammyError) {
      logger.error("Telegram API error", e, {
        updateId: ctx.update.update_id,
        method: e.method,
        description: e.description
      });
      return;
    }

    if (e instanceof HttpError) {
      logger.error("Telegram network error", e, {
        updateId: ctx.update.update_id
      });
      return;
    }

    logger.error("Unexpected bot error", e, {
      updateId: ctx.update.update_id
    });
  });

  await bot.start({
    onStart: (botInfo) => {
      logger.info("Bot started", { username: botInfo.username, id: botInfo.id });
    }
  });

  logger.warn("Bot stopped polling unexpectedly");
}

async function shutdown(signal: string): Promise<void> {
  logger.warn("Shutdown signal received", { signal });
  await prisma.$disconnect();
  logger.info("Database disconnected");
}

process.on("SIGINT", () => {
  shutdown("SIGINT")
    .catch((error) => logger.error("Error during SIGINT shutdown", error))
    .finally(() => process.exit(0));
});

process.on("SIGTERM", () => {
  shutdown("SIGTERM")
    .catch((error) => logger.error("Error during SIGTERM shutdown", error))
    .finally(() => process.exit(0));
});

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", reason);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", error);
});

bootstrap().catch(async (error) => {
  logger.error("Failed to start bot", error);
  await prisma.$disconnect();
  process.exit(1);
});
