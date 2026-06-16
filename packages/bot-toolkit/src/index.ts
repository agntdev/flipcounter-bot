import { Bot, session } from "grammy";
import type { Context, SessionFlavor } from "grammy";

export interface SessionData {}

export type BotContext = Context & SessionFlavor<SessionData>;

export function createBot(token: string): Bot<BotContext> {
  const bot = new Bot<BotContext>(token);

  bot.use(session({ initial: (): SessionData => ({}) }));

  return bot;
}
