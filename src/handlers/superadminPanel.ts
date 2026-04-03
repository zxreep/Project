import { Role } from "@prisma/client";
import { InlineKeyboard, type Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { sendLogToGroup } from "../services/logGroup";
import type { BotContext } from "../types/bot";
import { logger } from "../utils/logger";

export const superadminKeyboard = new InlineKeyboard()
  .text("CHECK USERS", "sa_check_users")
  .row()
  .text("CHECK ADMINS", "sa_check_admins");

function isSuperadmin(userId: number | undefined): boolean {
  if (!userId) {
    return false;
  }

  return BigInt(userId) === env.SUPERADMIN_ID;
}

function formatUserList(
  title: string,
  users: Array<{ telegramId: bigint; username: string | null; firstName: string | null; lastName: string | null }>
): string {
  if (users.length === 0) {
    return `${title}\nNo records found.`;
  }

  const lines = users.map((user, index) => {
    const display = user.username
      ? `@${user.username}`
      : [user.firstName, user.lastName].filter(Boolean).join(" ") || "Unnamed";

    return `${index + 1}. ${display} (${user.telegramId.toString()})`;
  });

  return `${title}\n${lines.join("\n")}`;
}

export function registerSuperadminPanelHandlers(bot: Bot<BotContext>): void {
  bot.callbackQuery(["sa_check_users", "sa_check_admins"], async (ctx) => {
    if (!isSuperadmin(ctx.from?.id)) {
      await ctx.answerCallbackQuery({ text: "Only superadmin can use this.", show_alert: true });
      return;
    }

    try {
      if (ctx.callbackQuery.data === "sa_check_users") {
        const users = await prisma.user.findMany({
          where: { role: Role.USER },
          orderBy: { createdAt: "desc" },
          take: 50,
          select: {
            telegramId: true,
            username: true,
            firstName: true,
            lastName: true
          }
        });

        await ctx.reply(formatUserList("👥 USER LIST", users));
        await ctx.answerCallbackQuery({ text: "User list sent." });

        await sendLogToGroup(
          ctx.api,
          `📋 <b>Superadmin requested USER list</b>\nBy: <code>${ctx.from.id}</code>\nCount: <code>${users.length}</code>`
        );
        return;
      }

      const admins = await prisma.user.findMany({
        where: { role: Role.ADMIN },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          telegramId: true,
          username: true,
          firstName: true,
          lastName: true
        }
      });

      await ctx.reply(formatUserList("🛡 ADMIN LIST", admins));
      await ctx.answerCallbackQuery({ text: "Admin list sent." });

      await sendLogToGroup(
        ctx.api,
        `📋 <b>Superadmin requested ADMIN list</b>\nBy: <code>${ctx.from.id}</code>\nCount: <code>${admins.length}</code>`
      );
    } catch (error) {
      logger.error("Failed handling superadmin panel callback", error, {
        actorId: ctx.from?.id,
        action: ctx.callbackQuery.data
      });

      await ctx.answerCallbackQuery({ text: "Failed to fetch data.", show_alert: true });
      await ctx.reply("Could not load the requested list right now. Please try again.");
    }
  });
}
