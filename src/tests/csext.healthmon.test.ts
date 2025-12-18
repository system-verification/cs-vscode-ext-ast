import { expect } from 'chai';
import { homedir } from 'node:os'
import * as path from 'node:path'
import { VSBrowser } from 'vscode-extension-tester';
import { runWithRetry } from '../utils/repeat';
import { ensureSuiteTimeout, applyVSCodeWindowUpdate, commandExecute, pauseTest, measurePerformance } from '../utils/generic';
import { CSHealthMonitorPage } from '../fw/cshealthmonitor.page'
import { explorerFileEdit } from '../concepts/explorer'
import { workbenchCSHealthMonitorOpen, workbenchExplorerOpen } from '../concepts/workbench'


describe('CodeScene Ext Health Monitor', function () {

  ensureSuiteTimeout(this)
  const GIT_PROJECT = 'FlaUI.WebDriver'
  const projectDir = path.join(homedir(), GIT_PROJECT, 'src', 'FlaUI.WebDriver')

  before(async () => {
    await VSBrowser.instance.openResources(projectDir)
    await commandExecute(projectDir, 'git', 'restore', '.')
    await applyVSCodeWindowUpdate()
  });

  afterEach(async () => {
      await commandExecute(projectDir, 'git', 'restore', '.')
  })

  it('Verify CS Health Monitor analysis for file update', async function () {
    await workbenchCSHealthMonitorOpen()
    await workbenchExplorerOpen()
    await explorerFileEdit(['Controllers', 'SessionController'], { fromLine: 8, toLine: 8, snippet: '\n\n\n' })

    await workbenchCSHealthMonitorOpen()
    const csHealthMonitor = await new CSHealthMonitorPage().init()
    expect(await (await csHealthMonitor.find('title')).getText()).to.contain('Health Monitor')

    const performance = await measurePerformance(async () => {
      await runWithRetry(async () => {
        expect(await csHealthMonitor.find('noCodeImpact', false)).to.be.undefined
        expect(await csHealthMonitor.find('negativeCodeImpact')).to.exist
        expect(await csHealthMonitor.find('impactFile [matching: SessionController]')).to.exist
      })
    })
    expect(performance).to.be.below(5000)

    // Simulate user reading the analysis
    // Verify that Health Monitor is still visible
    await pauseTest(10000)
    expect(await (await csHealthMonitor.find('title')).getText()).to.contain('Health Monitor')
  });
});
