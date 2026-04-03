import { Bot } from "grammy";
import { env } from "../config/env";
import type { BotContext } from "../types/bot";
import { registerStartHandler } from "../handlers/start";

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  registerStartHandler(bot);

  return bot;
}
