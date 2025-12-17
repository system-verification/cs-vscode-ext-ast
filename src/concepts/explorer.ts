import { promises as fs } from 'node:fs'
import * as path from 'node:path'
import { ExplorerPage } from '../fw/explorer.page'
import { TextEditor, VSBrowser } from 'vscode-extension-tester'

type ActiveFileUpdateParams = {
	fromLine: number
	toLine: number
	snippet: string
}

export async function explorerFileOpen(explorer: ExplorerPage, matchingSegments: string[]): Promise<void> {
	for (const segment of matchingSegments) {
		const fileEntry = await explorer.find(`fileName [matching: ${segment}]`)
		await fileEntry.click()
	}
}

export async function explorerActiveFileUpdate({ fromLine, toLine, snippet }: ActiveFileUpdateParams): Promise<void> {
	const editor = new TextEditor()
	await editor.moveCursor(fromLine, 1)

	const filePath = await editor.getFilePath()
	if (!filePath) {
		throw new Error('Unable to resolve active editor file path')
	}

	const workspaceRoot = process.cwd()
	const relativeFilePath = path.relative(workspaceRoot, filePath)

	const documentText = await fs.readFile(filePath, 'utf-8')
	const newline = documentText.includes('\r\n') ? '\r\n' : '\n'
	const lines = documentText.length > 0 ? documentText.split(/\r?\n/) : []

	const startIndex = Math.min(Math.max(0, fromLine - 1), lines.length)
	const safeEndLine = Math.max(toLine, fromLine)
	const endIndex = lines.length === 0 ? -1 : Math.min(lines.length - 1, safeEndLine - 1)
	const afterIndex = Math.min(lines.length, Math.max(endIndex + 1, startIndex))

	const snippetLines = snippet.length > 0 ? snippet.split(/\r?\n/) : ['']
	const updatedLines = [
		...lines.slice(0, startIndex),
		...snippetLines,
		...lines.slice(afterIndex)
	]

	const normalizedText = updatedLines.join(newline)
	await fs.writeFile(filePath, normalizedText, 'utf-8')

	const resourceToOpen = relativeFilePath.length > 0 ? relativeFilePath : filePath
	await VSBrowser.instance.openResources(resourceToOpen, async () => {
		const refreshedEditor = new TextEditor()
		await refreshedEditor.moveCursor(fromLine, 1)
	})
}
