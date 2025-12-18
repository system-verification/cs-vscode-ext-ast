import { expect } from 'chai';
import { homedir } from 'node:os'
import * as path from 'node:path'
import { VSBrowser } from 'vscode-extension-tester';
import { runWithRetry } from '../utils/repeat';
import { ensureSuiteTimeout, applyVSCodeWindowUpdate, commandExecute, pauseTest } from '../utils/generic';
import { CSHealthMonitorPage } from '../fw/cshealthmonitor.page'
import { CSACEPage } from '../fw/csace.page'
import { explorerFileEdit } from '../concepts/explorer'
import { workbenchCSHealthMonitorOpen, workbenchExplorerOpen } from '../concepts/workbench'


describe('CodeScene Ext ACE', function () {

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

  it('Verify CS ACE view', async function () {
    await workbenchCSHealthMonitorOpen()
    await workbenchExplorerOpen()
    await explorerFileEdit(['Controllers', 'SessionController'], { fromLine: 8, toLine: 8, snippet: '\n\n\n' })

    await workbenchCSHealthMonitorOpen()

    const csHealthMonitor = await new CSHealthMonitorPage().init()
    expect(await (await csHealthMonitor.find('title')).getText()).to.contain('Health Monitor')

    var impactFile
    const assertionStart = performance.now()
    await runWithRetry(async () => {
      impactFile = await csHealthMonitor.find('impactFile [matching: SessionController]')
      expect(impactFile).to.exist
    })
    expect(performance.now() - assertionStart).to.be.below(5000)

    await impactFile!.click()
    await runWithRetry(async () => {
      await (await csHealthMonitor.find('impactFunction [matching: GetApp]')).click()
      await (await csHealthMonitor.find('autoRefactor')).click()
    })

    var csACE = await new CSACEPage().init()
    expect(await csACE.find('impactFile [matching: SessionController]')).to.exist
    await (await csACE.find('enableACE')).click()
    await csACE.init() // re-enter correct frame
    expect(await csACE.find('acceptAutoRefactor')).to.exist
  });
});
