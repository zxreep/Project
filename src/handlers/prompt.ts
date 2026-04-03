import { Role } from "@prisma/client";
import { InlineKeyboard, type Api, type Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import {
  buildReferralLink,
  getOrCreateReferralToken,
  syncUserFromContext
} from "../services/referral";
import { sendLogToGroup } from "../services/logGroup";
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

const promotedMessage = `🎉 <b>You're Now an Admin!</b>

Congratulations! You’ve been promoted to <b>Admin</b> 🚀

🛠 You can now:
• Create and manage quizzes
• Broadcast messages & files
• Manage your assigned users
• Access admin tools

📌 Use your access responsibly and help manage the system smoothly.

Let’s get started 💼`;

function isPrivileged(actorId: bigint): boolean {
  return actorId === env.SUPERADMIN_ID;
}

export async function notifyReferralSystemUpdate(api: Api, botUsername: string): Promise<void> {
  const privilegedUsers = await prisma.user.findMany({
    where: {
      role: {
        in: [Role.ADMIN, Role.SUPERADMIN]
      }
    }
  });

  for (const user of privilegedUsers) {
    try {
      const token = await getOrCreateReferralToken(user.id);
      const link = buildReferralLink(botUsername, token);
      await api.sendMessage(
        user.telegramId.toString(),
        `🚀 Referral system is now live!\n\nYour referral link:\n${link}`
      );
    } catch (error) {
      logger.warn("Failed to send referral rollout message", {
        userId: user.telegramId.toString(),
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
}

export function registerPromptHandler(bot: Bot<BotContext>): void {
  bot.command("prompt", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const actorId = BigInt(ctx.from.id);

    if (!isPrivileged(actorId)) {
      logger.warn("Unauthorized /prompt attempt", {
        actorId: actorId.toString(),
        username: ctx.from.username ?? null
      });

      await sendLogToGroup(
        ctx.api,
        `⚠️ <b>Unauthorized /prompt attempt</b>\nActor: <code>${actorId.toString()}</code>\nUsername: <code>${ctx.from.username ?? "n/a"}</code>`
      );

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
      const existing = await prisma.user.findUnique({ where: { telegramId: targetTelegramId } });

      const promotedUser = await prisma.user.upsert({
        where: { telegramId: targetTelegramId },
        update: {
          role: Role.ADMIN
        },
        create: {
          telegramId: targetTelegramId,
          role: Role.ADMIN
        }
      });

      const token = await getOrCreateReferralToken(promotedUser.id);
      const referralLink = buildReferralLink(ctx.me.username, token);

      logger.info("Promoted user to admin", {
        actorId: actorId.toString(),
        targetId: targetTelegramId.toString()
      });

      await ctx.api.sendMessage(targetTelegramId.toString(), promotedMessage, {
        parse_mode: "HTML",
        reply_markup: new InlineKeyboard().url("GET REFERRAL LINK", referralLink)
      });

      const targetUsername = promotedUser.username ?? existing?.username ?? "unknown";
      await ctx.reply(`USER ${targetUsername} (${targetTelegramId.toString()})\nSuccessfully promoted to Admin.`);

      await sendLogToGroup(
        ctx.api,
        `👑 <b>User promoted to Admin</b>\nBy: <code>${actorId.toString()}</code>\nUser: <code>${targetUsername}</code>\nID: <code>${targetTelegramId.toString()}</code>`
      );
    } catch (error) {
      logger.error("Failed handling /prompt", error, {
        actorId: actorId.toString(),
        targetId: targetTelegramId.toString()
      });

      await sendLogToGroup(
        ctx.api,
        `❌ <b>/prompt failed</b>\nActor: <code>${actorId.toString()}</code>\nTarget: <code>${targetTelegramId.toString()}</code>`
      );

      await ctx.reply("Could not promote this user right now. Please try again.");
    }
  });

  bot.command("referral", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const user = await syncUserFromContext(ctx);

    if (user.role !== Role.ADMIN && user.role !== Role.SUPERADMIN) {
      await ctx.reply("Referral links are available for admins only.");
      return;
    }

    const token = await getOrCreateReferralToken(user.id);
    const link = buildReferralLink(ctx.me.username, token);

    await ctx.reply(`🔗 Your referral link:\n${link}`);
  });

  bot.command("my_referrals", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const admin = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    if (!admin || (admin.role !== Role.ADMIN && admin.role !== Role.SUPERADMIN)) {
      await ctx.reply("This command is for admins only.");
      return;
    }

    const count = await prisma.user.count({ where: { referredById: admin.id } });
    await ctx.reply(`👥 Total referred users: ${count}`);
  });

  bot.command("my_users", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const admin = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from.id) } });
    if (!admin || (admin.role !== Role.ADMIN && admin.role !== Role.SUPERADMIN)) {
      await ctx.reply("This command is for admins only.");
      return;
    }

    const users = await prisma.user.findMany({
      where: { referredById: admin.id },
      orderBy: { createdAt: "desc" },
      take: 50
    });

    if (users.length === 0) {
      await ctx.reply("No users referred yet.");
      return;
    }

    const text = users
      .map((u, i) => `${i + 1}. ${u.username ? `@${u.username}` : u.firstName ?? "Unnamed"} (${u.telegramId.toString()})`)
      .join("\n");
    await ctx.reply(`📋 Your users:\n${text}`);
  });
}
