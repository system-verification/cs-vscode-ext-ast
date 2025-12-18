import { WebDriver } from 'selenium-webdriver';
import { BasePage, type LocatorDictionary } from './base.page'
import { WebViewPage } from './webview.page'

export class CSACEPage extends BasePage {

    constructor(driver?: WebDriver) {
        super(driver, CSACEPage.initLocators())
    }

    private static initLocators(): LocatorDictionary {
        return {
            title: 'h1',
            outerACEFrame: '(//iframe[contains(@class,"ready")])[2]',
            aceFrame: '//iframe[contains(@title,"CodeScene ACE")]',
            impactFile: '//div//*[contains(text(),"dynamic_content")]',
            enableACE: '//button//div[contains(text(),"Enable CodeScene ACE")]',
            acceptAutoRefactor: '//button//div[contains(text(),"Accept Auto-Refactor")]'
        }
    }

    async init(): Promise<CSACEPage> {
        await this.driver.switchTo().defaultContent()
        await this.driver.switchTo().frame(await this.find('outerACEFrame'))
        await this.driver.switchTo().frame(await this.find('aceFrame'))
        return this
    }
}