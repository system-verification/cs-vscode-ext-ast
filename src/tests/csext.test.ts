import { expect } from 'chai';
import { VSBrowser } from 'vscode-extension-tester';
import { ensureSuiteTimeout, applyVSCodeWindowUpdate } from '../utils/generic';
import { CSHealthMonitorPage } from '../fw/cshealthmonitor.page'
import { workbenchCSHealthMonitorOpen } from '../concepts/workbench'

describe('CodeScene Ext smoke test', function () {

  ensureSuiteTimeout(this)

  before(async () => {
    await VSBrowser.instance.openResources()
    await applyVSCodeWindowUpdate()
  });

  it('Verify CodeScene Ext', async function () {
    await workbenchCSHealthMonitorOpen()

    const csHealthMonitor = await new CSHealthMonitorPage().init()
    expect(await (await csHealthMonitor.find('title')).getText()).to.contain('Health Monitor')
    expect(await csHealthMonitor.find('noCodeImpact', false)).to.exist
  });
});
