import { Role } from "@prisma/client";
import { Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import type { BotContext } from "../types/bot";

function parseUserId(input?: string): bigint | null {
  if (!input) {
    return null;
  }

  try {
    return BigInt(input.trim());
  } catch {
    return null;
  }
}

export function registerPromptHandler(bot: Bot<BotContext>): void {
  bot.command("prompt", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    if (BigInt(ctx.from.id) !== env.SUPERADMIN_ID) {
      await ctx.reply("Only superadmin can use this command.");
      return;
    }

    const targetIdRaw = ctx.match?.toString().trim();
    const targetTelegramId = parseUserId(targetIdRaw);

    if (!targetTelegramId) {
      await ctx.reply("Usage: /prompt <userid>");
      return;
    }

    await prisma.user.upsert({
      where: { telegramId: targetTelegramId },
      update: { role: Role.ADMIN },
      create: {
        telegramId: targetTelegramId,
        role: Role.ADMIN
      }
    });

    await ctx.reply(`User ${targetTelegramId.toString()} has been promoted to admin.`);
  });
}
