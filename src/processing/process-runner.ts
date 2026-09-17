import { spawn, ChildProcess } from "child_process";
import { logger } from "../utils/logger.js";

export interface ProcessResult {
  code: number | null;
  stdout: string;
  stderr: string;
}

export interface ProcessOptions {
  timeoutMs?: number;
  idleTimeoutMs?: number;
  onProgress?: (data: string) => void;
  abortSignal?: AbortSignal;
}

export async function runProcess(
  command: string, 
  args: string[], 
  options: ProcessOptions = {}
): Promise<ProcessResult> {
  return new Promise((resolve, reject) => {
    logger.debug({ command, args }, "Spawning process");
    const child: ChildProcess = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    
    let stdout = "";
    let stderr = "";
    
    let isDone = false;
    
    let timeoutId: NodeJS.Timeout | null = null;
    let idleTimeoutId: NodeJS.Timeout | null = null;

    const resetIdle = () => {
      if (idleTimeoutId) clearTimeout(idleTimeoutId);
      if (options.idleTimeoutMs) {
        idleTimeoutId = setTimeout(() => {
          logger.warn({ command, args }, "Process idle timeout");
          cleanupAndReject(new Error("Process idle timeout"));
        }, options.idleTimeoutMs);
      }
    };

    const cleanupAndReject = (err: Error) => {
      if (isDone) return;
      isDone = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleTimeoutId) clearTimeout(idleTimeoutId);
      child.kill("SIGTERM");
      setTimeout(() => { if (!child.killed) child.kill("SIGKILL"); }, 2000);
      reject(err);
    };

    if (options.timeoutMs) {
      timeoutId = setTimeout(() => {
        logger.warn({ command, args }, "Process timeout");
        cleanupAndReject(new Error("Process timeout"));
      }, options.timeoutMs);
    }
    
    resetIdle();

    if (options.abortSignal) {
      options.abortSignal.addEventListener('abort', () => {
        cleanupAndReject(new Error("Process aborted"));
      });
    }

    child.stdout?.on("data", (data) => {
      resetIdle();
      const str = data.toString();
      stdout += str;
      if (options.onProgress) options.onProgress(str);
    });

    child.stderr?.on("data", (data) => {
      resetIdle();
      stderr += data.toString();
    });

    child.on("error", (err) => {
      cleanupAndReject(err);
    });

    child.on("close", (code) => {
      if (isDone) return;
      isDone = true;
      if (timeoutId) clearTimeout(timeoutId);
      if (idleTimeoutId) clearTimeout(idleTimeoutId);
      
      resolve({ code, stdout, stderr });
    });
  });
}
