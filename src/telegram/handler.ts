import { Api } from "telegram";
import { NewMessageEvent } from "telegram/events/index.js";
import { isSafeUrl, normalizeUrl } from "../utils/ssrf.js";
import { queueTask } from "../queue/manager.js";
import { logger } from "../utils/logger.js";
import crypto from "crypto";

// URL Regex to find URLs in messages
const urlRegex = /(https?:\/\/[^\s]+)/g;

export async function handleNewMessage(event: NewMessageEvent) {
  const message = event.message;
  
  // We only process private messages or messages mentioning the bot?
  // Let's process text messages containing URLs from allowed chats or self.
  // For safety, you might want to restrict to self or admins.
  // Assuming this is a personal userbot, we can process 'me' or specific users.
  
  // For now, let's just parse URLs from any message (you can restrict this later).
  if (!message.text) return;

  const urls = message.text.match(urlRegex);
  if (!urls) return;

  for (const rawUrl of urls) {
    logger.info({ url: rawUrl }, "Detected URL in message");
    
    if (!(await isSafeUrl(rawUrl))) {
      logger.warn({ url: rawUrl }, "Unsafe URL detected, skipping.");
      continue;
    }

    const normalized = normalizeUrl(rawUrl);
    
    // Create task
    const taskId = crypto.randomUUID();
    const chatId = message.chatId ? message.chatId.toString() : "";
    
    queueTask({
      taskId,
      url: rawUrl,
      normalizedUrl: normalized,
      status: 'QUEUED',
      phase: 'INITIALIZATION',
      downloaded: 0,
      total: 0,
      speed: 0,
      eta: 0,
      percent: 0,
      retryCount: 0,
      resolverAttempts: 0,
      downloaderAttempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      replyToMessageId: message.id,
      chatId
    });
    
    // Send acknowledgement
    try {
      if (message.chatId) {
         await message.client?.sendMessage(message.chatId, {
           message: `Task Queued: ${taskId}\nURL: ${normalized}`,
           replyTo: message.id
         });
      }
    } catch (err) {
      logger.error({ err }, "Failed to send acknowledgement");
    }
  }
}
