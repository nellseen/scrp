import { Task } from "../types/index.js";
import { ProcessedData } from "../processing/ffmpeg.js";
import { getTelegramClient } from "./userbot.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import fs from "fs";

export async function uploadMedia(task: Task, processedData: ProcessedData) {
  const client = getTelegramClient();
  
  if (!client) {
    throw new Error("Telegram client is not connected");
  }
  
  let targetChat: string | number = env.TARGET_CHANNEL_ID || task.chatId!;
  if (!targetChat) {
    throw new Error("No configured target channel or chat ID to upload to");
  }

  // Ensure targetChat is a number if it's a numeric string (like channel IDs -100xxx)
  if (typeof targetChat === "string" && /^-?\d+$/.test(targetChat)) {
    // GramJS prefers bigints or numbers for IDs
    targetChat = Number(targetChat);
  }

  logger.info({ taskId: task.taskId, targetChat }, "Uploading media to target channel");

  let thumbPath: string | undefined = undefined;
  if (processedData.thumbnailPath && fs.existsSync(processedData.thumbnailPath)) {
    thumbPath = processedData.thumbnailPath;
  }

  await client.sendFile(targetChat, {
    file: processedData.filePath,
    thumb: thumbPath,
    caption: `Here is your media.\nURL: ${task.normalizedUrl}`,
    replyTo: targetChat === task.chatId ? task.replyToMessageId : undefined,
    progressCallback: (progress: number) => {
      // Could throttle and send progress to chat or WebSocket
      task.percent = Math.round(progress * 100);
    }
  });
  
  logger.info({ taskId: task.taskId }, "Media upload successful");
}
