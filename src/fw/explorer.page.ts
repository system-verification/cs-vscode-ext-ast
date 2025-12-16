import { WebDriver } from 'selenium-webdriver';
import { BasePage, type LocatorDictionary } from './base.page'

export class ExplorerPage extends BasePage {
    constructor(driver?: WebDriver) {
        super(driver, ExplorerPage.initLocators())
    }

    private static initLocators(): LocatorDictionary {
        return {
            id: '//*[@id="workbench.view.explorer"]',
            fileName: '//div[contains(@aria-label,"dynamic_content")]'
        }
    }
}
