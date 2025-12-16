import type { Suite } from 'mocha';
import { execa } from 'execa'
import * as path from 'node:path'

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
