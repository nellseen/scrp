import { Task, SourceCandidate } from "../types/index.js";
import { runProcess } from "../processing/process-runner.js";
import path from "path";
import fs from "fs";

export async function downloadAria2c(task: Task, candidate: SourceCandidate, destDir: string): Promise<string> {
  const ext = candidate.mediaType || "mp4";
  const outputPath = path.join(destDir, `media.${ext}`);
  
  const args = [
    "--console-log-level=warn",
    "-x", "4",
    "-s", "4",
    "-d", destDir,
    "-o", `media.${ext}`,
    candidate.sourceUrl || candidate.originalUrl
  ];

  await runProcess("aria2c", args, { timeoutMs: 300000 }); // 5 min timeout
  
  if (!fs.existsSync(outputPath)) {
    throw new Error("aria2c completed but output file not found");
  }
  
  return outputPath;
}
