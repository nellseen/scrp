import { Task, SourceCandidate } from "../types/index.js";

export async function resolveDirect(task: Task): Promise<SourceCandidate | null> {
  // Simple HEAD request to see if it's a direct media link
  const abortController = new AbortController();
  const id = setTimeout(() => abortController.abort(), 10000);
  
  try {
    const res = await fetch(task.normalizedUrl, {
      method: "HEAD",
      signal: abortController.signal
    });
    
    clearTimeout(id);
    
    const contentType = res.headers.get("content-type") || "";
    
    if (contentType.startsWith("video/") || contentType.startsWith("audio/")) {
      return {
        sourceUrl: task.normalizedUrl,
        originalUrl: task.normalizedUrl,
        mediaType: contentType.split("/")[1],
        mimeType: contentType,
        title: task.normalizedUrl.split('/').pop() || "media",
        requiresBrowser: false,
        requiresAuth: false,
        isLive: false,
        isPlaylist: false,
        drm: false,
        resolver: "direct",
        confidence: 0.8
      };
    }
  } catch (error) {
    // Fail silently, it's just a fallback resolver
  }
  
  throw new Error("Not a direct media link");
}
