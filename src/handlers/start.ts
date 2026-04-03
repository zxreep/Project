import { Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { sendLogToGroup } from "../services/logGroup";
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
      const role = resolveRole(telegramId, env.SUPERADMIN_ID, existingUser as { role?: "USER" | "ADMIN" | "SUPERADMIN" } | null);

      const user = await prisma.user.upsert({
        where: { telegramId },
        update: {
          username: ctx.from.username ?? null,
          firstName: ctx.from.first_name ?? null,
          lastName: ctx.from.last_name ?? null,
          ...( { role } as Record<string, unknown> )
        },
        create: {
          telegramId,
          username: ctx.from.username ?? null,
          firstName: ctx.from.first_name ?? null,
          lastName: ctx.from.last_name ?? null,
          ...( { role } as Record<string, unknown> )
        }
      });

      const savedRole = (user as { role?: string }).role;

      logger.info("Handled /start", {
        telegramId: telegramId.toString(),
        role: savedRole ?? role,
        username: ctx.from.username ?? null
      });

      await sendLogToGroup(
        ctx.api,
        `✅ <b>/start success</b>\nUser: <code>${ctx.from.username ?? "n/a"}</code>\nID: <code>${telegramId.toString()}</code>\nRole: <b>${humanRole(savedRole ?? role)}</b>`
      );

      await ctx.reply(`${baseMessage}\n\n🔐 Your role: ${humanRole(savedRole ?? role)}`);
    } catch (error) {
      logger.error("Failed handling /start", error, {
        telegramId: telegramId.toString(),
        username: ctx.from.username ?? null
      });

      await sendLogToGroup(
        ctx.api,
        `❌ <b>/start failed</b>\nUser: <code>${ctx.from.username ?? "n/a"}</code>\nID: <code>${telegramId.toString()}</code>`
      );

      await ctx.reply("Sorry, something went wrong while setting up your account. Please try again.");
    }
  });
}
