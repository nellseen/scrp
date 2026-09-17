import { Task, SourceCandidate } from "../types/index.js";
import { runProcess } from "../processing/process-runner.js";

export async function resolveHls(task: Task): Promise<SourceCandidate | null> {
  if (task.normalizedUrl.includes(".m3u8")) {
    return {
      sourceUrl: task.normalizedUrl,
      originalUrl: task.normalizedUrl,
      mediaType: "hls",
      manifestUrl: task.normalizedUrl,
      title: task.normalizedUrl.split('/').pop() || "media",
      requiresBrowser: false,
      requiresAuth: false,
      isLive: false,
      isPlaylist: true,
      drm: false,
      resolver: "hls",
      confidence: 0.8
    };
  }
  throw new Error("Not an HLS playlist");
}
