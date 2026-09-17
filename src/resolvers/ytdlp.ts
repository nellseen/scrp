import { Task, SourceCandidate } from "../types/index.js";
import { runProcess } from "../processing/process-runner.js";

export async function resolveYtdlp(task: Task): Promise<SourceCandidate | null> {
  // Use yt-dlp to dump JSON
  const args = [
    "--dump-json",
    "--no-warnings",
    "--no-playlist",
    task.normalizedUrl
  ];

  const result = await runProcess("yt-dlp", args, { timeoutMs: 30000 });
  
  if (result.code !== 0) {
    throw new Error(`yt-dlp failed: ${result.stderr}`);
  }
  
  const data = JSON.parse(result.stdout);
  
  return {
    sourceUrl: data.url,
    originalUrl: task.normalizedUrl,
    protocol: data.protocol,
    mediaType: data.ext, // simplifying
    title: data.title,
    uploader: data.uploader,
    duration: data.duration,
    width: data.width,
    height: data.height,
    fps: data.fps,
    requiresBrowser: false,
    requiresAuth: false,
    isLive: data.is_live || false,
    isPlaylist: false,
    drm: false,
    resolver: "yt-dlp",
    confidence: 0.9,
    headersReference: data.http_headers
  };
}
