import dotenv from "dotenv";
import { z } from "zod";
dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(3000),
  TELEGRAM_API_ID: z.coerce.number().optional(),
  TELEGRAM_API_HASH: z.string().optional(),
  BOT_TOKEN: z.string().optional(), // For Control Bot
  ADMIN_ID: z.coerce.number().optional(), // Telegram User ID of admin
  TARGET_CHANNEL_ID: z.string().optional(), // Destination for processed media
  STORAGE_WARNING_THRESHOLD: z.coerce.number().default(85),
  STORAGE_CRITICAL_THRESHOLD: z.coerce.number().default(95),
  CONCURRENCY_LIMIT: z.coerce.number().default(3),
  WS_SECRET: z.string().default("ws-secret"),
  DOWNLOAD_DIR: z.string().default("./downloads"),
});

const _env = envSchema.safeParse(process.env);

if (!_env.success) {
  console.error("Invalid environment variables", _env.error.format());
  process.exit(1);
}

export const env = _env.data;
