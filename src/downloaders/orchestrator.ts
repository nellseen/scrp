import { Task, SourceCandidate } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { downloadYtdlp } from "./ytdlp.js";
import { downloadAria2c } from "./aria2c.js";
import path from "path";
import fs from "fs";

const DOWNLOADERS = [
  { name: 'yt-dlp', fn: downloadYtdlp, priority: 1 },
  { name: 'aria2c', fn: downloadAria2c, priority: 2 },
];

export async function downloadMedia(task: Task, candidate: SourceCandidate): Promise<string> {
  let lastError: Error | null = null;
  
  const destDir = path.join(process.cwd(), "downloads", task.taskId);
  if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });

  const sortedDownloaders = [...DOWNLOADERS].sort((a, b) => a.priority - b.priority);

  for (const downloader of sortedDownloaders) {
    try {
      logger.info({ taskId: task.taskId, downloader: downloader.name }, "Attempting download");
      task.downloaderUsed = downloader.name;
      task.downloaderAttempts++;
      
      const filePath = await downloader.fn(task, candidate, destDir);
      
      if (filePath && fs.existsSync(filePath)) {
        task.filePath = filePath;
        logger.info({ taskId: task.taskId, downloader: downloader.name }, "Download success");
        return filePath;
      }
    } catch (error: any) {
      logger.warn({ taskId: task.taskId, downloader: downloader.name, err: error }, "Downloader failed");
      lastError = error;
    }
  }
  
  throw new Error(lastError ? `All downloaders failed. Last error: ${lastError.message}` : "All downloaders failed.");
}
