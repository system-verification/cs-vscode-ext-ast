import { ExplorerPage } from '../fw/explorer.page'
import { TextEditor } from 'vscode-extension-tester'

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

export async function exlorerActiveFileUpdate({ fromLine, toLine, snippet }: ActiveFileUpdateParams): Promise<void> {
	const editor = new TextEditor()
	const documentText = await editor.getText()
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
	await editor.setText(normalizedText)
	await editor.save()
}
