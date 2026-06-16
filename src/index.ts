import { createBot } from "@agntdev/bot-toolkit";
import { InlineKeyboard } from "grammy";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = createBot(token);

bot.command("ping", async (ctx) => {
  await ctx.reply("pong");
});

bot.command("start", async (ctx) => {
  const keyboard = new InlineKeyboard()
    .text("🪙 Flip", "cmd:flip")
    .text("📊 Count", "cmd:count")
    .row()
    .text("❓ Help", "cmd:help");

  await ctx.reply(
    "👋 Welcome to FlipCounter Bot!\n\nI can flip a coin for you and keep track of how many flips you've made. Use the menu below or type a command:",
    { reply_markup: keyboard },
  );
});

bot.callbackQuery(/^cmd:(.+)$/, async (ctx) => {
  const cmd = ctx.match[1];
  await ctx.answerCallbackQuery();
  await ctx.reply(`Use the /${cmd} command to continue.`);
});

bot.start({
  onStart: (info) => {
    console.log(`Bot @${info.username} started`);
  },
});
