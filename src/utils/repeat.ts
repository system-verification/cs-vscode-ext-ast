import { WebDriver } from 'selenium-webdriver';
import retry = require('async-retry');
import { VSBrowser } from 'vscode-extension-tester';

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
  const result = await driver.wait(async () => action(), timeout, message);
  return result as T;
}


