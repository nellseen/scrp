import { Telegraf } from "telegraf";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { getAllActiveTasks } from "../db/index.js";

let bot: Telegraf | null = null;

export function startControlBot() {
  if (!env.BOT_TOKEN) {
    logger.warn("BOT_TOKEN is missing. Control Bot will not start.");
    return;
  }

  bot = new Telegraf(env.BOT_TOKEN);

  // Admin middleware
  bot.use((ctx, next) => {
    if (env.ADMIN_ID && ctx.from?.id !== env.ADMIN_ID) {
      return;
    }
    return next();
  });

  bot.command("status", (ctx) => {
    const tasks = getAllActiveTasks();
    if (tasks.length === 0) {
      return ctx.reply("No active tasks.");
    }
    
    const lines = tasks.map(t => `ID: ${t.taskId}\nStatus: ${t.status}\nPhase: ${t.phase}\nURL: ${t.normalizedUrl}\n`);
    ctx.reply(lines.join("\n"));
  });
  
  bot.command("start", (ctx) => {
    ctx.reply("Control Bot active.");
  });

  bot.launch().catch(err => {
    logger.error({ err }, "Control Bot failed to launch");
  });
  
  logger.info("Control Bot started.");
}

export function stopControlBot() {
  if (bot) {
    bot.stop("SIGTERM");
  }
}
