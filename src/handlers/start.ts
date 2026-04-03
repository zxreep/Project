import { Role } from "@prisma/client";
import { Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
import { sendLogToGroup } from "../services/logGroup";
import { resolveAdminByReferralToken } from "../services/referral";
import { resolveRole, humanRole } from "../services/userRole";
import type { BotContext } from "../types/bot";
import { logger } from "../utils/logger";
import { superadminKeyboard } from "./superadminPanel";

const baseMessage = `👋 Welcome to Smart Quiz Bot!

🎯 Play live quizzes with friends
🏆 Compete on real-time leaderboards
📚 Get shared study materials & updates

🚀 What you can do:
• Join live quiz rooms
• Track your score & rank
• Receive important content`;

function parseStartToken(raw: string): string | null {
  const token = raw.trim();
  if (!token) {
    return null;
  }
  return token.split(/\s+/)[0] ?? null;
}

export function registerStartHandler(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    if (!ctx.from) {
      await ctx.reply("Unable to identify your Telegram account.");
      return;
    }

    const telegramId = BigInt(ctx.from.id);
    const startToken = parseStartToken(ctx.match?.toString() ?? "");

    try {
      const existingUser = await prisma.user.findUnique({ where: { telegramId } });
      const role = resolveRole(telegramId, env.SUPERADMIN_ID, existingUser);

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

      let referralNote = "";

      if (startToken) {
        const referralAdmin = await resolveAdminByReferralToken(startToken);

        if (!referralAdmin) {
          referralNote = "\n\n⚠️ Invalid referral link.";
        } else if (referralAdmin.telegramId === user.telegramId) {
          referralNote = "\n\n⚠️ Self-referral is not allowed.";
        } else if (user.role === Role.ADMIN || user.role === Role.SUPERADMIN || user.role === Role.MODERATOR) {
          referralNote = "\n\nℹ️ Referral assignment skipped for privileged account.";
        } else if (user.referredById === referralAdmin.id) {
          referralNote = "\n\nℹ️ You are already assigned to this admin.";
        } else {
          await prisma.user.update({
            where: { id: user.id },
            data: { referredById: referralAdmin.id }
          });

          referralNote =
            user.referredById && user.referredById !== referralAdmin.id
              ? "\n\n✅ Referral updated. You are now linked to a new admin."
              : "\n\n✅ Referral applied. You are now linked to an admin.";

          await sendLogToGroup(
            ctx.api,
            `🔗 <b>Referral linked</b>\nUser: <code>${user.telegramId.toString()}</code>\nAdmin: <code>${referralAdmin.telegramId.toString()}</code>\nToken: <code>${startToken}</code>`
          );
        }
      }

      const roleLabel = humanRole(user.role);

      logger.info("Handled /start", {
        telegramId: telegramId.toString(),
        role: roleLabel,
        username: ctx.from.username ?? null,
        referralTokenUsed: startToken ?? null
      });

      await sendLogToGroup(
        ctx.api,
        `✅ <b>/start success</b>\nUser: <code>${ctx.from.username ?? "n/a"}</code>\nID: <code>${telegramId.toString()}</code>\nRole: <b>${roleLabel}</b>`
      );

      const fullMessage = `${baseMessage}\n\n🔐 Your role: ${roleLabel}${referralNote}`;

      if (roleLabel === "superadmin") {
        await ctx.reply(fullMessage, {
          reply_markup: superadminKeyboard
        });
        return;
      }

      await ctx.reply(fullMessage);
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
