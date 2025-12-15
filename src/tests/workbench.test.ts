import { expect } from 'chai';
import { VSBrowser, Workbench } from 'vscode-extension-tester';

import { applyConfiguredWindowSize } from '../utils/windowSizing';

// Simple smoke test to confirm VS Code launches under eXTester control
describe('Workbench smoke test', function () {
  this.timeout(60000);

  before(async () => {
    // Ensure VS Code is ready before running assertions
    await VSBrowser.instance.openResources();
    await applyConfiguredWindowSize();
  });

  it('Verify vstest', async () => {
    const titleBar = await new Workbench().getTitleBar();
    const title = await titleBar.getTitle();

    expect(title).to.contain('Visual Studio Code');
  });
});
