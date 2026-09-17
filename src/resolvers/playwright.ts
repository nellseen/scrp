import { chromium } from "playwright";
import { Task, SourceCandidate } from "../types/index.js";
import { logger } from "../utils/logger.js";

export async function resolvePlaywright(task: Task): Promise<SourceCandidate | null> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    
    let mediaUrl = "";
    let mediaType = "";
    
    page.on("request", (req) => {
      const rt = req.resourceType();
      if (rt === "media") {
        mediaUrl = req.url();
        mediaType = "video";
      }
      if (rt === "fetch" || rt === "xhr") {
        const u = req.url();
        if (u.includes(".m3u8") || u.includes(".mpd")) {
          mediaUrl = u;
          mediaType = "playlist";
        }
      }
    });
    
    await page.goto(task.normalizedUrl, { waitUntil: "networkidle", timeout: 20000 });
    
    // Check if we got something
    if (mediaUrl) {
      return {
        sourceUrl: mediaUrl,
        originalUrl: task.normalizedUrl,
        requiresBrowser: true,
        requiresAuth: false,
        isLive: false,
        isPlaylist: mediaType === "playlist",
        drm: false,
        resolver: "playwright",
        confidence: 0.5
      };
    }
    
    throw new Error("Playwright found no media requests");
  } catch (error) {
    throw error;
  } finally {
    if (browser) {
      await browser.close().catch((err) => logger.error({ err }, "Error closing Playwright browser"));
    }
  }
}
