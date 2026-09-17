import Database from "better-sqlite3";
import path from "path";
import fs from "fs";
import { logger } from "../utils/logger.js";
import type { Task, TaskStatus } from "../types/index.js";

const DB_PATH = path.join(process.cwd(), "data", "app.db");

// Ensure data dir exists
if (!fs.existsSync(path.join(process.cwd(), "data"))) {
  fs.mkdirSync(path.join(process.cwd(), "data"), { recursive: true });
}

export const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    taskId TEXT PRIMARY KEY,
    url TEXT NOT NULL,
    normalizedUrl TEXT NOT NULL,
    status TEXT NOT NULL,
    data TEXT NOT NULL,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    sessionData TEXT NOT NULL
  );
`);

const insertTaskStmt = db.prepare(`
  INSERT OR REPLACE INTO tasks (taskId, url, normalizedUrl, status, data, createdAt, updatedAt)
  VALUES (@taskId, @url, @normalizedUrl, @status, @data, @createdAt, @updatedAt)
`);

const getTaskStmt = db.prepare("SELECT * FROM tasks WHERE taskId = ?");
const getAllActiveTasksStmt = db.prepare("SELECT * FROM tasks WHERE status NOT IN ('COMPLETED', 'FAILED', 'CANCELLED')");

export function saveTask(task: Task) {
  try {
    insertTaskStmt.run({
      taskId: task.taskId,
      url: task.url,
      normalizedUrl: task.normalizedUrl,
      status: task.status,
      data: JSON.stringify(task),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
    });
  } catch (error) {
    logger.error({ taskId: task.taskId, err: error }, "Failed to save task to DB");
  }
}

export function getTask(taskId: string): Task | null {
  const row = getTaskStmt.get(taskId) as any;
  if (!row) return null;
  return JSON.parse(row.data);
}

export function getAllActiveTasks(): Task[] {
  const rows = getAllActiveTasksStmt.all() as any[];
  return rows.map((r) => JSON.parse(r.data));
}

export function saveSession(id: string, sessionData: string) {
  db.prepare("INSERT OR REPLACE INTO sessions (id, sessionData) VALUES (?, ?)").run(id, sessionData);
}

export function getSession(id: string): string | null {
  const row = db.prepare("SELECT sessionData FROM sessions WHERE id = ?").get(id) as any;
  return row ? row.sessionData : null;
}
