import { createBot } from "./bot";
import { prisma } from "./db/prisma";

async function bootstrap(): Promise<void> {
  const bot = createBot();

  bot.catch((err) => {
    console.error("Telegram bot error", err);
  });

  await bot.start({
    onStart: (botInfo) => {
      console.log(`Bot @${botInfo.username} is running in long-polling mode.`);
    }
  });
}

bootstrap().catch(async (error) => {
  console.error("Failed to start bot", error);
  await prisma.$disconnect();
  process.exit(1);
});

process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
