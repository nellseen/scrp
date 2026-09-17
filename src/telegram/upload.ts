import { Task } from "../types/index.js";
import { ProcessedData } from "../processing/ffmpeg.js";
import { getTelegramClient } from "./userbot.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import fs from "fs";
import { CustomFile } from "telegram/client/uploads.js";

export async function uploadMedia(task: Task, processedData: ProcessedData) {
  const client = getTelegramClient();
  
  if (!client) {
    throw new Error("Telegram client is not connected");
  }
  
  const targetChat = env.TARGET_CHANNEL_ID || task.chatId;
  if (!targetChat) {
    throw new Error("No configured target channel or chat ID to upload to");
  }

  const fileStats = fs.statSync(processedData.filePath);
  
  const toUpload = new CustomFile(
    processedData.filePath.split("/").pop() || "media.mp4",
    fileStats.size,
    processedData.filePath
  );

  let thumbFile: CustomFile | undefined = undefined;
  if (processedData.thumbnailPath && fs.existsSync(processedData.thumbnailPath)) {
    const thumbStats = fs.statSync(processedData.thumbnailPath);
    thumbFile = new CustomFile(
      "thumb.jpg",
      thumbStats.size,
      processedData.thumbnailPath
    );
  }

  logger.info({ taskId: task.taskId, targetChat }, "Uploading media to target channel");

  await client.sendFile(targetChat, {
    file: toUpload,
    thumb: thumbFile,
    caption: `Here is your media.\nURL: ${task.normalizedUrl}`,
    replyTo: targetChat === task.chatId ? task.replyToMessageId : undefined,
    progressCallback: (progress: number) => {
      // Could throttle and send progress to chat or WebSocket
      task.percent = Math.round(progress * 100);
    }
  });
  
  logger.info({ taskId: task.taskId }, "Media upload successful");
}
