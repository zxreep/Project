import { Context, SessionFlavor } from "grammy";

export interface SessionData {
  startedAt?: string;
}

export type BotContext = Context & SessionFlavor<SessionData>;
