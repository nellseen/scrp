import pino from "pino";
import fs from "fs";
import path from "path";

// Determine log path. Prefer /sdcard/Download if running in Termux/Android
let errorLogPath = path.join(process.cwd(), "data", "error.txt");

if (fs.existsSync("/sdcard/Download")) {
  errorLogPath = "/sdcard/Download/telegram_media_engine_error.txt";
} else {
  // Ensure data directory exists for local logs
  const logDir = path.join(process.cwd(), "data");
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
}

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  serializers: {
    err: pino.stdSerializers.err,
    error: pino.stdSerializers.err,
  },
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
        target: "pino-pretty", // Use pino-pretty for the file so it's readable
        level: "error", // Only log errors (or fatal) to this file
        options: {
          destination: errorLogPath,
          colorize: false, // No colors for text file
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
          singleLine: false, // Allow multi-line stack traces
          errorProps: "*", // Include all properties of the error object
          mkdir: true,
        },
      }
    ]
  },
});

