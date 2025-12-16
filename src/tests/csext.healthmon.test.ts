import { expect } from 'chai';
import { homedir } from 'node:os'
import * as path from 'node:path'
import { ActivityBar, VSBrowser } from 'vscode-extension-tester';
import { waitFor, runWithRetry } from '../utils/repeat';
import { ensureSuiteTimeout, commandExecute, pauseTest } from '../utils/generic';
import { applyConfiguredWindowSize } from '../utils/windowSizing';
import { ExplorerPage } from '../fw/explorer.page'
import { WebViewPage } from '../fw/webview.page'
import { CSHealthMonitorPage } from '../fw/cshealthmonitor.page'
import { explorerFileOpen, exlorerActiveFileUpdate } from '../concepts/explorer'


describe('CodeScene Ext Health Monitor', function () {

  ensureSuiteTimeout(this)
  const GIT_PROJECT = 'FlaUI.WebDriver'
  const projectDir = path.join(homedir(), GIT_PROJECT, 'src', 'FlaUI.WebDriver')

  before(async () => {
    await VSBrowser.instance.openResources(projectDir)
    await commandExecute(projectDir, 'git', 'restore', '.')
    await applyConfiguredWindowSize()
  });

  afterEach(async () => {
      await commandExecute(projectDir, 'git', 'restore', '.')
  })

  it('Verify CS Health Monitor analysis for file update', async function () {
    // Open some file in Explorer
    const explorer = new ExplorerPage()
    expect(await explorer.visible('id')).to.be.true
    await explorerFileOpen(explorer, ['Controllers', 'SessionController'])
    await exlorerActiveFileUpdate({ fromLine: 8, toLine: 8, snippet: '\n\n\n' })

    await runWithRetry(async () => {
      const activityBar = new ActivityBar()
      const codeSceneControl = await waitFor(() => activityBar.getViewControl('CodeScene'))
      await codeSceneControl!.openView()
    })

    const driver = VSBrowser.instance.driver
    const webview = new WebViewPage()
    await driver.switchTo().frame(await webview.find('outerFrame'));
    await driver.switchTo().frame(await webview.find('healthMonitorFrame'))

    await pauseTest(10000)

    const csHealthMonitor = new CSHealthMonitorPage()
    expect(await (await csHealthMonitor.find('title')).getText()).to.contain('Health Monitor')

    const assertionStart = performance.now()
    await runWithRetry(async () => {
      expect(await csHealthMonitor.find('noCodeImpact', false)).to.be.undefined
      expect(await csHealthMonitor.find('negativeCodeImpact')).to.exist
      expect(await csHealthMonitor.find('impactAnalysis [matching: SessionController]')).to.exist
    })
    expect(performance.now() - assertionStart).to.be.below(5000)

    await driver.switchTo().defaultContent()
  });
});
