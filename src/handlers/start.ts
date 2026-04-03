import { Bot } from "grammy";
import type { BotContext } from "../types/bot";

const startMessage = `👋 Welcome to Smart Quiz Bot!

🎯 Play live quizzes with friends
🏆 Compete on real-time leaderboards
📚 Get shared study materials & updates

🚀 What you can do:
• Join live quiz rooms
• Track your score & rank
• Receive important content`;

export function registerStartHandler(bot: Bot<BotContext>): void {
  bot.command("start", async (ctx) => {
    await ctx.reply(startMessage);
  });
}
