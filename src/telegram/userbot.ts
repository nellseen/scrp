import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { LogLevel } from "telegram/extensions/Logger.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { saveSession, getSession } from "../db/index.js";
import input from "input";
import { handleNewMessage } from "./handler.js";
import { NewMessage } from "telegram/events/index.js";

let client: TelegramClient | null = null;

export async function startUserbot() {
  if (!env.TELEGRAM_API_ID || !env.TELEGRAM_API_HASH) {
    logger.warn("TELEGRAM_API_ID or TELEGRAM_API_HASH is missing. Userbot will not start.");
    return;
  }

  const sessionString = getSession("userbot_session") || "";
  const stringSession = new StringSession(sessionString);

  client = new TelegramClient(stringSession, env.TELEGRAM_API_ID, env.TELEGRAM_API_HASH, {
    connectionRetries: 5,
    useWSS: false,
  });

  client.setLogLevel(LogLevel.ERROR);

  logger.info("Starting Telegram Userbot...");

  try {
    await client.start({
      phoneNumber: async () => await input.text("Please enter your number: "),
      password: async () => await input.text("Please enter your password: "),
      phoneCode: async () => await input.text("Please enter the code you received: "),
      onError: (err) => logger.error({ err }, "Error during Telegram login"),
    });

    logger.info("Telegram Userbot connected.");
    saveSession("userbot_session", client.session.save() as unknown as string);

    client.addEventHandler(handleNewMessage, new NewMessage({}));
  } catch (error) {
    logger.error({ err: error }, "Failed to start Telegram Userbot");
  }
}

export function getTelegramClient(): TelegramClient | null {
  return client;
}
