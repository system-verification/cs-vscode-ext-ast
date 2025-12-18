import type { Suite } from 'mocha';
import { execa } from 'execa'
import * as path from 'node:path'
import { performance } from 'node:perf_hooks'
import { VSBrowser } from 'vscode-extension-tester';
import { loadWindowConfig } from '../config/windowConfig';

export function ensureSuiteTimeout(
	context: Suite | { timeout?: (ms?: number) => number },
	desiredMs = 180000
): void {
	if (!context?.timeout || typeof context.timeout !== 'function') {
		return;
	}

	const current = context.timeout();
	const isUnset = typeof current !== 'number' || current < desiredMs;
	if (isUnset) {
		context.timeout(desiredMs);
	}
}

export async function commandExecute(directory: string, executable: string, ...args: string[]): Promise<string> {
	const workspaceRoot = directory ? path.resolve(directory) : process.cwd()
	const result = await execa(executable, args, {
		cwd: workspaceRoot,
		env: process.env,
		reject: false,
		all: true
	})
	if (result.exitCode !== 0) {
		const errorOutput = result.all ?? result.stderr ?? ''
		throw new Error(`Command ${executable} failed with code ${result.exitCode}: ${errorOutput}`)
	}
	return result.stdout ?? ''
}

export async function pauseTest(durationMs = 5000): Promise<void> {
    await new Promise<void>((resolve) => setTimeout(resolve, durationMs))
}

/**
 * Measures how long the provided action takes to run and resolves with the elapsed milliseconds.
 */
export async function measurePerformance(action: () => Promise<unknown> | unknown): Promise<number> {
	const start = performance.now();
	await action();
	return performance.now() - start;
}

const SCRIPT = `
  (function resizeAndMove(x, y, width, height) {
	try {
	  window.moveTo(x, y);
	  window.resizeTo(width, height);
	} catch (err) {
	  console.warn('Window sizing script failed', err);
	}
  })(arguments[0], arguments[1], arguments[2], arguments[3]);
`;

/**
 * Applies the window size defined in extester.window.json to the launched VS Code instance.
 * Uses a small script executed in the Electron renderer to avoid unsupported WebDriver commands.
 */
export async function applyVSCodeWindowUpdate(): Promise<void> {
  const config = loadWindowConfig();
  const driver = VSBrowser.instance.driver;
  const x = typeof config.x === 'number' ? config.x : 0;
  const y = typeof config.y === 'number' ? config.y : 0;

  await driver.executeScript(SCRIPT, x, y, config.width, config.height);
}
