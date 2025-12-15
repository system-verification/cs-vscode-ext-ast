import { VSBrowser } from 'vscode-extension-tester';
import { loadWindowConfig } from '../config/windowConfig';

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
export async function applyConfiguredWindowSize(): Promise<void> {
  const config = loadWindowConfig();
  const driver = VSBrowser.instance.driver;
  const x = typeof config.x === 'number' ? config.x : 0;
  const y = typeof config.y === 'number' ? config.y : 0;

  await driver.executeScript(SCRIPT, x, y, config.width, config.height);
}
