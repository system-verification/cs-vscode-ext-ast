import { ActivityBar } from 'vscode-extension-tester'
import { waitFor, runWithRetry } from '../utils/repeat'

export async function workbenchCSHealthMonitorOpen(): Promise<void> {
    await runWithRetry(async () => {
        const activityBar = new ActivityBar()
        const codeSceneControl = await waitFor(() => activityBar.getViewControl('CodeScene'))
        await codeSceneControl!.openView()
    })
}
