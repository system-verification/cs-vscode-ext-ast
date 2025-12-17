import { WebDriver } from 'selenium-webdriver';
import { BasePage, type LocatorDictionary } from './base.page'

export class WebViewPage extends BasePage {
    constructor(driver?: WebDriver) {
        super(driver, WebViewPage.initLocators())
    }

    private static initLocators(): LocatorDictionary {
        return {
            outerFrame: 'iframe.webview',
            outerACEFrame: '//iframe[contains(@name,"a64c")]',
            healthMonitorFrame: 'iframe[title=""]',
            aceFrame: 'iframe[title="CodeScene ACE"]'
        }
    }
}
