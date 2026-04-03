import { Bot } from "grammy";
import { prisma } from "../db/prisma";
import { resolveRole, humanRole } from "../services/userRole";
import type { BotContext } from "../types/bot";
import { logger } from "../utils/logger";

const baseMessage = `👋 Welcome to Smart Quiz Bot!

🎯 Play live quizzes with friends
🏆 Compete on real-time leaderboards
📚 Get shared study materials & updates

🚀 What you can do:
• Join live quiz rooms
• Track your score & rank
• Receive important content`;

export function registerStartHandler(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const telegramId = BigInt(ctx.from.id);

    try {
      const existingUser = await prisma.user.findUnique({ where: { telegramId } });
      const role = resolveRole(telegramId, existingUser);

      const user = await prisma.user.upsert({
        where: { telegramId },
        update: {
          username: ctx.from.username ?? null,
          firstName: ctx.from.first_name ?? null,
          lastName: ctx.from.last_name ?? null,
          role
        },
        create: {
          telegramId,
          username: ctx.from.username ?? null,
          firstName: ctx.from.first_name ?? null,
          lastName: ctx.from.last_name ?? null,
          role
        }
      });

      logger.info("Handled /start", {
        telegramId: telegramId.toString(),
        role: user.role,
        username: ctx.from.username ?? null
      });

      await ctx.reply(`${baseMessage}\n\n🔐 Your role: ${humanRole(user.role)}`);
    } catch (error) {
      logger.error("Failed handling /start", error, {
        telegramId: telegramId.toString(),
        username: ctx.from.username ?? null
      });
      await ctx.reply("Sorry, something went wrong while setting up your account. Please try again.");
    }
  });
}
