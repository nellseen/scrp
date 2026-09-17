import { Task, SourceCandidate } from "../types/index.js";
import { runProcess } from "../processing/process-runner.js";
import path from "path";
import fs from "fs";

export async function downloadYtdlp(task: Task, candidate: SourceCandidate, destDir: string): Promise<string> {
  const outputPath = path.join(destDir, "media.%(ext)s");
  
  const args = [
    "--no-warnings",
    "--no-playlist",
    "-o", outputPath,
    candidate.sourceUrl || candidate.originalUrl
  ];

  await runProcess("yt-dlp", args, { timeoutMs: 300000 }); // 5 min timeout
  
  // Find the downloaded file
  const files = fs.readdirSync(destDir);
  const mediaFile = files.find(f => f.startsWith("media."));
  
  if (!mediaFile) {
    throw new Error("yt-dlp completed but output file not found");
  }
  
  return path.join(destDir, mediaFile);
}
