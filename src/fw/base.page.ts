import { By, WebDriver, WebElement } from 'selenium-webdriver';
import { VSBrowser } from 'vscode-extension-tester';
import { waitFor } from '../utils/repeat';

export type Locator = string | By;
export type LocatorDictionary = Record<string, string>

export class BasePage {
    protected readonly driver: WebDriver;
    protected readonly locators: LocatorDictionary;

    constructor(
        driver: WebDriver = VSBrowser.instance.driver,
        locators: LocatorDictionary = {}
    ) {
        this.driver = driver;
        this.locators = locators;
    }

    async find(locator: Locator): Promise<WebElement>
    async find(locator: Locator, waitForExist: true): Promise<WebElement>
    async find(locator: Locator, waitForExist: false): Promise<WebElement | undefined>
    async find(locator: Locator, waitForExist = true): Promise<WebElement | undefined> {
        const resolved = typeof locator === 'string'
            ? this.tryGetLocator(locator) ?? locator
            : locator;
        const by = this.toBy(resolved);
        if (waitForExist) {
            return waitFor(() => this.driver.findElement(by), { driver: this.driver });
        }

        const existing = await this.driver.findElements(by)
        return existing[0]
    }

    async visible(logicalName: string): Promise<boolean> {
        await this.find(logicalName)
        return true
    }

	protected toBy(locator: Locator): By {
		if (typeof locator !== 'string') {
			return locator;
		}

		const normalized = locator.trim();
		return normalized.startsWith('//') ? By.xpath(normalized) : By.css(normalized);
	}

    private tryGetLocator(logicalName: string): string | undefined {
        let lookupName = logicalName
        let dynamicContent: string | undefined

        const dynamicMatch = logicalName.match(/^(.*?)\s*\[matching:\s*(.+?)\s*\]$/)
        if (dynamicMatch) {
            lookupName = dynamicMatch[1].trim()
            dynamicContent = dynamicMatch[2].trim()
        }

        const resolved = this.locators[lookupName]
        if (!resolved) {
            return undefined
        }

        const normalized = BasePage.normalizeLocator(resolved)
        if (!dynamicContent) {
            return normalized
        }

        return normalized.replace(/dynamic_content/g, dynamicContent)
    }

    private static normalizeLocator(locator: string): string {
        const trimmed = locator.trim()
        if (trimmed.startsWith('xpath=')) {
            return trimmed.slice('xpath='.length)
        }

        if (trimmed.startsWith('css=')) {
            return trimmed.slice('css='.length)
        }

        return trimmed
    }
}
