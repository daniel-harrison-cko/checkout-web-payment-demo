import { browser, ExpectedConditions } from 'protractor';
import { WebPaymentDemoPage } from '../pages/web-payment-demo-page.po';

describe('Refund', () => {
    let webPaymentDemo: WebPaymentDemoPage;

    beforeAll(() => {
        webPaymentDemo = new WebPaymentDemoPage();
        browser.waitForAngularEnabled(false);
    });

    beforeEach(() => {
        browser.waitForAngular();
    });

    afterAll(() => {
        browser.sleep(3000);
    });

    describe('on make refund', () => {

        afterEach(() => {
            browser.sleep(200);
        });

        it('should click refund', () => {
            webPaymentDemo.clickRefundButton();
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.refundPrompt), 100, 'refundPrompt is not present');
            expect(webPaymentDemo.refundPrompt.isPresent()).toBe(true);
        });

        it('should configure refund', () => {
            webPaymentDemo.configureRefund();
            expect(webPaymentDemo.refundConfirmButton.isEnabled()).toBe(true);
        });

        it('should confirm refund', () => {
            webPaymentDemo.refundConfirmButton.click();
            browser.sleep(3000);
            expect(webPaymentDemo.paymentStatus.getText()).toBe('Refunded');
        });
    });
});
