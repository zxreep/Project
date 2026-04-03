import { GrammyError, HttpError } from "grammy";
import { createBot } from "./bot";
import { prisma } from "./db/prisma";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  logger.info("Bootstrapping bot process");

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
