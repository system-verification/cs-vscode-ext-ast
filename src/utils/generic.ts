import type { Suite } from 'mocha';

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
