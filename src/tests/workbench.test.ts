import { expect } from 'chai';
import { VSBrowser, Workbench } from 'vscode-extension-tester';
import { ensureSuiteTimeout, applyVSCodeWindowUpdate } from '../utils/generic';

// Simple smoke test to confirm VS Code launches under eXTester control
describe('Workbench smoke test', function () {
  ensureSuiteTimeout(this)

  before(async () => {
    // Ensure VS Code is ready before running assertions
    await VSBrowser.instance.openResources()
    await applyVSCodeWindowUpdate()
  });

  it('Verify vstest', async () => {
    const titleBar = await new Workbench().getTitleBar()
    const title = await titleBar.getTitle()

    expect(title).to.contain('Visual Studio Code')
  });
});
