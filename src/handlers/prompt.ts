import { Bot } from "grammy";
import { env } from "../config/env";
import { prisma } from "../db/prisma";
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

const promotedMessage = `🎉 <bold>You're Now an Admin!</bold>

Congratulations! You’ve been promoted to <bold>Admin</bold> 🚀

🛠 You can now:
• Create and manage quizzes
• Broadcast messages & files
• Manage your assigned users
• Access admin tools

📌 Use your access responsibly and help manage the system smoothly.

Let’s get started 💼`;

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
      const promotedUser = await prisma.user.upsert({
        where: { telegramId: targetTelegramId },
        update: { ...( { role: "ADMIN" } as Record<string, unknown> ) },
        create: {
          telegramId: targetTelegramId,
          ...( { role: "ADMIN" } as Record<string, unknown> )
        }
      });

      logger.info("Promoted user to admin", {
        actorId: actorId.toString(),
        targetId: targetTelegramId.toString()
      });

      await ctx.api.sendMessage(targetTelegramId.toString(), promotedMessage, {
        parse_mode: "HTML"
      });

      const targetUsername = promotedUser.username ?? "unknown";
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
}
