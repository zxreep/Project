import { Bot } from "grammy";
import { env } from "../config/env";
import { registerPromptHandler } from "../handlers/prompt";
import { registerStartHandler } from "../handlers/start";
import { sendLogToGroup } from "../services/logGroup";
import type { BotContext } from "../types/bot";
import { logger } from "../utils/logger";

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  bot.use(async (ctx, next) => {
    const updateType = Object.keys(ctx.update).filter((key) => key !== "update_id");

    logger.info("Incoming update", {
      updateId: ctx.update.update_id,
      fromId: ctx.from?.id,
      username: ctx.from?.username ?? null,
      chatId: ctx.chat?.id,
      updateType
    });

    await sendLogToGroup(
      ctx.api,
      `📩 <b>Incoming update</b>\n` +
        `Update ID: <code>${ctx.update.update_id}</code>\n` +
        `From: <code>${ctx.from?.id ?? "unknown"}</code>\n` +
        `Username: <code>${ctx.from?.username ?? "n/a"}</code>\n` +
        `Type: <code>${updateType.join(",") || "unknown"}</code>`
    );

    await next();
  });

  registerStartHandler(bot);
  registerPromptHandler(bot);

  return bot;
}
