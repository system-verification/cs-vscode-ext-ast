import { WebDriver } from 'selenium-webdriver';
import retry = require('async-retry');
import { VSBrowser } from 'vscode-extension-tester';

export type RetryableAction<T> = () => Promise<T>;

/**
 * Executes the provided action using async-retry with default settings.
 */
export type RunWithRetryOptions = {
  timeoutMs?: number;
};

const DEFAULT_RETRY_TIMEOUT_MS = 5000;

/**
 * Executes the provided action using async-retry with a default 5s timeout.
 */
export async function runWithRetry<T>(
  action: RetryableAction<T>,
  options: RunWithRetryOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_RETRY_TIMEOUT_MS;
  let timeoutHandle: NodeJS.Timeout | undefined;

  const retryPromise = retry(async (bail: (error: Error) => void) => {
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

  const timeoutPromise = new Promise<T>((_, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new Error(`runWithRetry timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([retryPromise, timeoutPromise]);
  } finally {
    if (timeoutHandle) {
      clearTimeout(timeoutHandle);
    }
  }
}

function normalizeError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

function isRetryableError(error: Error): boolean {
  const name = error.name ?? '';
  return name.includes('StaleElementReference') || name.includes('NoSuchWindow') ||
    name.includes('AssertionError') || name.includes('ElementNotInteractableError');
}

const DEFAULT_WAIT_TIMEOUT = 10000;
const DEFAULT_WAIT_MESSAGE = 'Condition timed out';

export type WaitForOptions = {
  timeout?: number;
  driver?: WebDriver;
  message?: string;
};

/**
 * Waits for the provided async predicate to return a truthy value.
 */
export async function waitFor<T>(
  action: () => Promise<T | undefined>,
  options: WaitForOptions = {}
): Promise<T> {
  const driver = options.driver ?? VSBrowser.instance.driver;
  const timeout = options.timeout ?? DEFAULT_WAIT_TIMEOUT;
  const message = options.message ?? DEFAULT_WAIT_MESSAGE;

  const result = await driver.wait(async () => {
    try {
      return await action();
    } catch (error) {
      if ((error as Error).name === 'NoSuchElementError') {
        return undefined; // keep waiting
      }
      throw error; // real failure
    }
  }, timeout, message);

  return result as T;
}


