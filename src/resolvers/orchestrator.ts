import { Task, SourceCandidate } from "../types/index.js";
import { logger } from "../utils/logger.js";
import { resolveYtdlp } from "./ytdlp.js";
import { resolveDirect } from "./direct.js";
import { resolvePlaywright } from "./playwright.js";
import { resolveHls } from "./hls.js";
import { resolveDash } from "./dash.js";

const RESOLVERS = [
  { name: 'hls', fn: resolveHls },
  { name: 'dash', fn: resolveDash },
  { name: 'yt-dlp', fn: resolveYtdlp },
  { name: 'direct', fn: resolveDirect },
  { name: 'playwright', fn: resolvePlaywright },
];

export async function resolveMedia(task: Task): Promise<SourceCandidate> {
  let lastError: Error | null = null;
  
  for (const resolver of RESOLVERS) {
    try {
      logger.info({ taskId: task.taskId, resolver: resolver.name }, "Attempting to resolve");
      task.resolverUsed = resolver.name;
      task.resolverAttempts++;
      // Save state
      
      const candidate = await resolver.fn(task);
      if (candidate) {
        logger.info({ taskId: task.taskId, resolver: resolver.name, candidate }, "Resolve success");
        return candidate;
      }
    } catch (error: any) {
      logger.warn({ taskId: task.taskId, resolver: resolver.name, err: error }, "Resolver failed");
      lastError = error;
    }
  }
  
  throw new Error(lastError ? `All resolvers failed. Last error: ${lastError.message}` : "All resolvers failed.");
}
