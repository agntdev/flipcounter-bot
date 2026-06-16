import { createBot } from "@agntdev/bot-toolkit";

const token = process.env.BOT_TOKEN;
if (!token) {
  throw new Error("BOT_TOKEN environment variable is required");
}

const bot = createBot(token);

bot.command("ping", async (ctx) => {
  await ctx.reply("pong");
});

bot.start({
  onStart: (info) => {
    console.log(`Bot @${info.username} started`);
  },
});
