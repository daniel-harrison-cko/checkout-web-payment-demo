import { browser, ExpectedConditions } from 'protractor';
import { WebPaymentDemoPage } from '../pages/web-payment-demo-page.po';

describe('Logout', () => {
    let webPaymentDemo: WebPaymentDemoPage;

    beforeAll(() => {
        webPaymentDemo = new WebPaymentDemoPage();
    });

    beforeEach(() => {
        browser.waitForAngular();
    });

    describe('on logout', () => {

        it('should log out', () => {
            webPaymentDemo.logout();
            browser.wait(ExpectedConditions.urlContains('/login'), 10000, 'logout was unsuccessful');
        });
    });
});
