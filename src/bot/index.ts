import { Bot } from "grammy";
import { env } from "../config/env";
import { registerPromptHandler } from "../handlers/prompt";
import { registerStartHandler } from "../handlers/start";
import type { BotContext } from "../types/bot";

export function createBot(): Bot<BotContext> {
  const bot = new Bot<BotContext>(env.BOT_TOKEN);

  registerStartHandler(bot);
  registerPromptHandler(bot);

  return bot;
}
