import { expect } from 'chai';
import { By } from 'selenium-webdriver';
import { WebView, ActivityBar, VSBrowser } from 'vscode-extension-tester';
import { waitFor, runWithRetry } from '../utils/repeat';
import { ensureSuiteTimeout } from '../utils/generic';
import { applyConfiguredWindowSize } from '../utils/windowSizing';

describe('CodeScene Ext smoke test', function () {

  ensureSuiteTimeout(this)

  before(async () => {
    await VSBrowser.instance.openResources()
    await applyConfiguredWindowSize()
  });

  it('Verify CodeScene Ext', async function () {
    await runWithRetry(async () => {
      const activityBar = new ActivityBar()
      const codeSceneControl = await waitFor(() => activityBar.getViewControl('CodeScene'))
      await codeSceneControl!.openView()
    })

    const driver = VSBrowser.instance.driver
    const outerFrame = await driver.findElement(By.css('iframe.webview'));
    await driver.switchTo().frame(outerFrame);

    const innerFrame = await driver.findElement(By.css('iframe[title=""]'))
    await driver.switchTo().frame(innerFrame)

    expect(await driver.findElement(By.css('h1')).getText()).to.contain('Health Monitor')
    expect(await driver.findElement(
      By.xpath('//*[contains(text(), "No code health impact detected in changes to your files")]')
    )).to.exist

    await driver.switchTo().defaultContent()

  });
});
