import fs from "fs";
import { logger } from "./logger.js";
import { env } from "../config/env.js";
import { execSync } from "child_process";

export function checkStorage(): 'HEALTHY' | 'WARNING' | 'CRITICAL' | 'EMERGENCY' {
  try {
    const output = execSync(`df -k ${process.cwd()}`, { encoding: 'utf-8' });
    const lines = output.split('\n');
    if (lines.length > 1) {
      const parts = lines[1].trim().split(/\s+/);
      if (parts.length >= 5) {
        const usePercentStr = parts[4].replace('%', '');
        const usePercent = parseInt(usePercentStr, 10);
        
        if (usePercent >= env.STORAGE_CRITICAL_THRESHOLD) return 'CRITICAL';
        if (usePercent >= env.STORAGE_WARNING_THRESHOLD) return 'WARNING';
        return 'HEALTHY';
      }
    }
  } catch (err) {
    logger.warn("Could not check storage space");
  }
  return 'HEALTHY';
}

export function isStorageCritical(): boolean {
  const status = checkStorage();
  return status === 'CRITICAL' || status === 'EMERGENCY';
}
