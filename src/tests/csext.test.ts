import { expect } from 'chai';
import { By } from 'selenium-webdriver';
import { ActivityBar, VSBrowser } from 'vscode-extension-tester';
import { applyConfiguredWindowSize } from '../utils/windowSizing';

// Simple smoke test to confirm VS Code launches under eXTester control
describe('CodeScene Ext smoke test', function () {

  before(async () => {
    // Ensure VS Code is ready before running assertions
    await VSBrowser.instance.openResources()
    await applyConfiguredWindowSize()
  });

  it('Verify CodeScene Ext', async () => {
    const driver = VSBrowser.instance.driver

    const cs = await driver.findElement(By.css('a.action-label[aria-label="CodeScene"]'))
    await cs!.click();

    const outerFrame = await driver.findElement(By.css('iframe.webview'))
    await driver.switchTo().frame(outerFrame)

    const innerFrame = await driver.findElement(By.css('iframe[title=""]'))
    await driver.switchTo().frame(innerFrame)

    const headingText = await driver.findElement(By.css('h1')).getText()
    expect(headingText).to.contain('Health Monitor')

    await driver.switchTo().defaultContent()

  });
});
