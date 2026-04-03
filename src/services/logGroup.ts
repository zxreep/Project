import type { Api } from "grammy";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export async function sendLogToGroup(api: Api, text: string): Promise<void> {
  try {
    await api.sendMessage(env.LOG_GROUP_ID.toString(), text, {
      parse_mode: "HTML"
    });
  } catch (error) {
    logger.warn("Failed to send log to group", {
      logGroupId: env.LOG_GROUP_ID.toString(),
      error: error instanceof Error ? error.message : String(error)
    });
  }
}
