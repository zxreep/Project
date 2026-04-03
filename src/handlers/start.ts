import { Role } from "@prisma/client";
import { Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import type { BotContext } from "../types/bot";

function formatRole(role: Role): "user" | "admin" | "superadmin" {
  switch (role) {
    case Role.ADMIN:
      return "admin";
    case Role.SUPERADMIN:
      return "superadmin";
    default:
      return "user";
  }
}

export function registerStartHandler(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const resolvedRole = telegramId === env.SUPERADMIN_ID ? Role.SUPERADMIN : Role.USER;

    const user = await prisma.user.upsert({
      where: { telegramId },
      update: {
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        lastName: ctx.from.last_name ?? null,
        role: telegramId === env.SUPERADMIN_ID ? Role.SUPERADMIN : undefined
      },
      create: {
        telegramId,
        username: ctx.from.username ?? null,
        firstName: ctx.from.first_name ?? null,
        lastName: ctx.from.last_name ?? null,
        role: resolvedRole
      }
    });

    const startMessage = `👋 Welcome to Smart Quiz Bot!

🎯 Play live quizzes with friends
🏆 Compete on real-time leaderboards
📚 Get shared study materials & updates

🚀 What you can do:
• Join live quiz rooms
• Track your score & rank
• Receive important content

🔐 Your role: ${formatRole(user.role)}`;

    await ctx.reply(startMessage);
  });
}
