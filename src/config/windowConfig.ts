import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

export type WindowConfig = {
  width: number;
  height: number;
  x?: number;
  y?: number;
};

const CONFIG_FILENAME = 'extester.window.json';
const DEFAULT_CONFIG: WindowConfig = {
  width: 1400,
  height: 900,
  x: 0,
  y: 0
};

export function loadWindowConfig(): WindowConfig {
  const configPath = join(process.cwd(), CONFIG_FILENAME);

  if (!existsSync(configPath)) {
    return DEFAULT_CONFIG;
  }

  try {
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw);

    return {
      width: pickNumber(parsed.width, DEFAULT_CONFIG.width),
      height: pickNumber(parsed.height, DEFAULT_CONFIG.height),
      x: pickOptionalNumber(parsed.x, DEFAULT_CONFIG.x),
      y: pickOptionalNumber(parsed.y, DEFAULT_CONFIG.y)
    };
  } catch (error) {
    console.warn(`Failed to load ${CONFIG_FILENAME}, using defaults`, error);
    return DEFAULT_CONFIG;
  }
}

function pickNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function pickOptionalNumber(value: unknown, fallback?: number): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
}
