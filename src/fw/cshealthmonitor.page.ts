import { WebDriver } from 'selenium-webdriver';
import { BasePage, type LocatorDictionary } from './base.page'

export class CSHealthMonitorPage extends BasePage {

    constructor(driver?: WebDriver) {
        super(driver, CSHealthMonitorPage.initLocators())
    }

    private static initLocators(): LocatorDictionary {
        return {
            title: 'h1',
            noCodeImpact: '//*[contains(text(), "No code health impact detected in changes to your files")]',
            negativeCodeImpact: '//*[contains(text(), "Negative impact of your changes")]',
            impactAnalysis: 'div[role="monitor-file-card"][aria-label*="dynamic_content"]'
        }
    }

}