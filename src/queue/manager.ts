import { Task, TaskStatus } from "../types/index.js";
import { saveTask, getTask, getAllActiveTasks } from "../db/index.js";
import { logger } from "../utils/logger.js";
import { resolveMedia } from "../resolvers/orchestrator.js";
import { downloadMedia } from "../downloaders/orchestrator.js";
import { processMedia } from "../processing/ffmpeg.js";
import { uploadMedia } from "../telegram/upload.js";
import { env } from "../config/env.js";
import { isStorageCritical } from "../utils/storage.js";

const activeTasks = new Map<string, Task>();
let runningWorkers = 0;

export async function queueTask(task: Task) {
  // Check duplicate
  const existingTasks = getAllActiveTasks();
  const isDuplicate = existingTasks.some(t => t.normalizedUrl === task.normalizedUrl && t.status !== 'FAILED' && t.status !== 'CANCELLED');
  
  if (isDuplicate) {
    logger.info({ url: task.normalizedUrl }, "Duplicate task detected, skipping.");
    // Maybe notify user about duplicate
    return;
  }

  saveTask(task);
  activeTasks.set(task.taskId, task);
  logger.info({ taskId: task.taskId }, "Task queued");
  
  processQueue();
}

export async function processQueue() {
  if (runningWorkers >= env.CONCURRENCY_LIMIT) {
    return;
  }
  
  if (isStorageCritical()) {
    logger.warn("Storage is critical. Pausing new tasks.");
    return;
  }
  
  const pendingTask = getAllActiveTasks().find(t => t.status === 'QUEUED' || t.status === 'RECOVERING');
  if (!pendingTask) return;

  runningWorkers++;
  pendingTask.status = 'ANALYZING';
  pendingTask.updatedAt = Date.now();
  saveTask(pendingTask);
  
  runTask(pendingTask).finally(() => {
    runningWorkers--;
    processQueue();
  });
}

import fs from "fs";
import path from "path";

async function runTask(task: Task) {
  try {
    // 1. Resolve
    task.status = 'RESOLVING';
    task.phase = 'Resolving media sources...';
    saveTask(task);
    const candidate = await resolveMedia(task);
    
    // 2. Download
    task.status = 'DOWNLOADING';
    task.phase = 'Downloading media...';
    saveTask(task);
    const downloadedPath = await downloadMedia(task, candidate);
    
    // 3. Process / Validate
    task.status = 'PROCESSING';
    task.phase = 'Validating and processing media...';
    saveTask(task);
    const processedData = await processMedia(task, downloadedPath);
    
    // 4. Upload
    task.status = 'UPLOADING';
    task.phase = 'Uploading to Telegram...';
    saveTask(task);
    await uploadMedia(task, processedData);
    
    // 5. Complete
    task.status = 'COMPLETED';
    task.phase = 'Done';
    task.completedAt = Date.now();
    saveTask(task);
    logger.info({ taskId: task.taskId }, "Task completed successfully");
    
  } catch (error: any) {
    logger.error({ taskId: task.taskId, err: error }, "Task failed");
    task.status = 'FAILED';
    task.error = error?.message || 'Unknown error';
    task.updatedAt = Date.now();
    saveTask(task);
    
    // We should notify user via Telegram
    const { getTelegramClient } = await import("../telegram/userbot.js");
    const client = getTelegramClient();
    if (client && task.chatId) {
      try {
        await client.sendMessage(task.chatId, {
          message: `Task Failed: ${task.taskId}\nError: ${task.error}`,
          replyTo: task.replyToMessageId
        });
      } catch (e) {
        logger.error({ err: e }, "Failed to send error notification");
      }
    }
  } finally {
    const destDir = path.join(process.cwd(), "downloads", task.taskId);
    if (fs.existsSync(destDir)) {
      fs.rmSync(destDir, { recursive: true, force: true });
      logger.info({ taskId: task.taskId }, "Cleaned up task directory");
    }
  }
}

export function initializeQueue() {
  const tasks = getAllActiveTasks();
  for (const task of tasks) {
    if (task.status !== 'COMPLETED' && task.status !== 'FAILED' && task.status !== 'CANCELLED') {
      task.status = 'RECOVERING';
      saveTask(task);
    }
  }
  processQueue();
}
