import express from "express";
import { WebSocketServer } from "ws";
import http from "http";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { startUserbot, getTelegramClient } from "./telegram/userbot.js";
import { startControlBot, stopControlBot } from "./telegram/controlbot.js";
import { initializeQueue } from "./queue/manager.js";

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ noServer: true });

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", active: true });
});

// WS authentication
server.on("upgrade", (request, socket, head) => {
  const url = new URL(request.url || "", `http://${request.headers.host}`);
  const token = url.searchParams.get("token");

  if (token !== env.WS_SECRET) {
    socket.write("HTTP/1.1 401 Unauthorized\\r\\n\\r\\n");
    socket.destroy();
    return;
  }

  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

wss.on("connection", (ws) => {
  logger.info("WebSocket client connected");
  ws.send(JSON.stringify({ event: "system_status", data: { status: "ready" } }));
});

// Startup sequence
async function startServer() {
  logger.info("Starting Media Processing System...");
  
  startControlBot();
  await startUserbot();
  initializeQueue();

  server.listen(env.PORT, "0.0.0.0", () => {
    logger.info(`Server listening on http://0.0.0.0:${env.PORT}`);
  });
}

// Graceful shutdown
async function shutdown(signal: string) {
  logger.info({ signal }, "Initiating graceful shutdown...");
  stopControlBot();
  const client = getTelegramClient();
  if (client) {
    await client.disconnect();
  }
  server.close(() => {
    logger.info("Server closed.");
    process.exit(0);
  });
  
  setTimeout(() => {
    logger.error("Force killing after timeout");
    process.exit(1);
  }, 10000);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

startServer().catch((err) => {
  logger.error({ err }, "Fatal error during startup");
  process.exit(1);
});
