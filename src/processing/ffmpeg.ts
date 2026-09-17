import { Task } from "../types/index.js";
import { runProcess } from "./process-runner.js";
import path from "path";
import fs from "fs";

export interface ProcessedData {
  filePath: string;
  thumbnailPath?: string;
}

export async function processMedia(task: Task, filePath: string): Promise<ProcessedData> {
  // Validate with ffprobe
  const ffprobeArgs = [
    "-v", "error",
    "-show_entries", "format=duration",
    "-of", "default=noprint_wrappers=1:nokey=1",
    filePath
  ];
  
  const res = await runProcess("ffprobe", ffprobeArgs, { timeoutMs: 15000 });
  if (res.code !== 0) {
    throw new Error(`Media validation failed: ${res.stderr}`);
  }
  
  const destDir = path.dirname(filePath);
  const thumbnailPath = path.join(destDir, "thumb.jpg");
  
  // Extract thumbnail (at 1 second or whatever)
  try {
    const ffmpegArgs = [
      "-y",
      "-i", filePath,
      "-ss", "00:00:01.000",
      "-vframes", "1",
      "-vf", "scale=320:-1",
      thumbnailPath
    ];
    await runProcess("ffmpeg", ffmpegArgs, { timeoutMs: 15000 });
    
    if (fs.existsSync(thumbnailPath)) {
      task.thumbnailPath = thumbnailPath;
    }
  } catch (err) {
    // Thumb is optional
  }

  return {
    filePath,
    thumbnailPath: task.thumbnailPath
  };
}
