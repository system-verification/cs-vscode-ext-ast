import { WebDriver } from 'selenium-webdriver';
import { BasePage, type LocatorDictionary } from './base.page'

export class WebViewPage extends BasePage {
    constructor(driver?: WebDriver) {
        super(driver, WebViewPage.initLocators())
    }

    private static initLocators(): LocatorDictionary {
        return {
            outerFrame: 'iframe.webview',
            activeFrame: 'iframe#active-frame',
            healthMonitorFrame: 'iframe[title=""]',
            aceFrame: 'iframe[title="CodeScene ACE"]'
        }
    }
}
