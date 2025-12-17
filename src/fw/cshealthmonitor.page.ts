import { WebDriver } from 'selenium-webdriver';
import { BasePage, type LocatorDictionary } from './base.page'
import { WebViewPage } from './webview.page'

export class CSHealthMonitorPage extends BasePage {

    constructor(driver?: WebDriver) {
        super(driver, CSHealthMonitorPage.initLocators())
    }

    private static initLocators(): LocatorDictionary {
        return {
            title: 'h1',
            outerFrame: 'iframe.webview',
            healthMonitorFrame: 'iframe[title=""]',
            noCodeImpact: '//*[contains(text(), "No code health impact detected in changes to your files")]',
            negativeCodeImpact: '//*[contains(text(), "Negative impact of your changes")]',
            impactFile: '//div[@role="monitor-file-card"]//*[contains(text(),"dynamic_content")]',
            impactFunction: '//div[@role="monitor-file-card"]//*[contains(text(),"dynamic_content")]',
            autoRefactor: '//button//*[contains(text(), "Auto-Refactor")]'
        }
    }

    async init(): Promise<CSHealthMonitorPage> {
        await this.driver.switchTo().defaultContent()
        await this.driver.switchTo().frame(await this.find('outerFrame'))
        await this.driver.switchTo().frame(await this.find('healthMonitorFrame'))
        return this
    }
}