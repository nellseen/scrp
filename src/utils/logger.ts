import pino from "pino";
import fs from "fs";
import path from "path";

// Ensure data directory exists for logs
const logDir = path.join(process.cwd(), "data");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const errorLogPath = path.join(logDir, "error.txt");

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport: {
    targets: [
      {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      },
      {
        target: "pino/file",
        level: "error", // Only log errors (or fatal) to this file
        options: {
          destination: errorLogPath,
          mkdir: true,
        },
      }
    ]
  },
});

