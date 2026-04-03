import { Bot } from "grammy";
import { env } from "../config/env";
import { registerPromptHandler } from "../handlers/prompt";
import { registerStartHandler } from "../handlers/start";
import type { BotContext } from "../types/bot";
import { logger } from "../utils/logger";

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  bot.use(async (ctx, next) => {
    logger.info("Incoming update", {
      updateId: ctx.update.update_id,
      fromId: ctx.from?.id,
      username: ctx.from?.username ?? null,
      chatId: ctx.chat?.id,
      updateType: Object.keys(ctx.update).filter((key) => key !== "update_id")
    });
    await next();
  });

  registerStartHandler(bot);
  registerPromptHandler(bot);

  return bot;
}
