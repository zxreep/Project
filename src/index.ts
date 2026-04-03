import { createBot } from "./bot";

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

bootstrap().catch((error) => {
  console.error("Failed to start bot", error);
  process.exit(1);
});
