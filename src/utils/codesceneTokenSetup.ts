import { Workbench } from 'vscode-extension-tester';

import { getCodeSceneAuthToken } from '../config/localConfig';
import { runWithRetry } from './retry';

const AUTH_SETTING_ID = 'codescene.authToken';

/**
 * Reads the CodeScene auth token from local.json and writes it into the workspace settings UI.
 */
export async function codesceneTokenSetup(): Promise<void> {
  const token = getCodeSceneAuthToken();
  await runWithRetry(() => applyToken(token));
}

async function applyToken(token: string): Promise<void> {
  const workbench = new Workbench();
  const editorView = await workbench.getEditorView();
  await editorView.wait();

  const settings = await workbench.openSettings();
  await settings.wait();
  await settings.switchToPerspective('User');

  const tokenSetting = await settings.findSettingByID(AUTH_SETTING_ID);
  if (!tokenSetting) {
    throw new Error(`Unable to locate the "${AUTH_SETTING_ID}" entry in the Settings editor.`);
  }

  await tokenSetting.wait();
  await tokenSetting.setValue(token);

  const editor = await workbench.getEditorView();
  await editor.closeEditor('Settings');
}
