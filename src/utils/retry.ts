import retry = require('async-retry');

export type RetryableAction<T> = () => Promise<T>;

/**
 * Executes the provided action using async-retry with default settings.
 */
export async function runWithRetry<T>(action: RetryableAction<T>): Promise<T> {
  return retry(async (bail: (error: Error) => void) => {
    try {
      return await action();
    } catch (error) {
      const normalizedError = normalizeError(error);

      if (!isRetryableError(normalizedError)) {
        bail(normalizedError);
        return Promise.reject(normalizedError);
      }

      throw normalizedError;
    }
  });
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isRetryableError(error: Error): boolean {
  const name = error.name ?? '';
  return name.includes('StaleElementReference') || name.includes('NoSuchWindow');
}
