import { Role } from "@prisma/client";
import { Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import type { BotContext } from "../types/bot";
import { logger } from "../utils/logger";

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

    const actorId = BigInt(ctx.from.id);

    if (actorId !== env.SUPERADMIN_ID) {
      logger.warn("Unauthorized /prompt attempt", {
        actorId: actorId.toString(),
        username: ctx.from.username ?? null
      });
      await ctx.reply("Only superadmin can use this command.");
      return;
    }

    const targetIdRaw = ctx.match?.toString().trim();
    const targetTelegramId = parseUserId(targetIdRaw);

    if (!targetTelegramId) {
      await ctx.reply("Usage: /prompt <userid>");
      return;
    }

    if (targetTelegramId === env.SUPERADMIN_ID) {
      await ctx.reply("This user is already superadmin.");
      return;
    }

    try {
      await prisma.user.upsert({
        where: { telegramId: targetTelegramId },
        update: { role: Role.ADMIN },
        create: {
          telegramId: targetTelegramId,
          role: Role.ADMIN
        }
      });

      logger.info("Promoted user to admin", {
        actorId: actorId.toString(),
        targetId: targetTelegramId.toString()
      });

      await ctx.reply(`User ${targetTelegramId.toString()} has been promoted to admin.`);
    } catch (error) {
      logger.error("Failed handling /prompt", error, {
        actorId: actorId.toString(),
        targetId: targetTelegramId.toString()
      });
      await ctx.reply("Could not promote this user right now. Please try again.");
    }
  });
}
