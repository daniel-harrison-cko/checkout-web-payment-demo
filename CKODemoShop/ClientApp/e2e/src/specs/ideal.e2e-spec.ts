import { browser, ExpectedConditions } from 'protractor';
import { WebPaymentDemoPage } from '../pages/web-payment-demo-page.po';
import { IdealConfiguration } from '../pages/ideal-configuration.po';

describe('iDEAL', () => {
    let webPaymentDemo: WebPaymentDemoPage;
    let idealConfiguration: IdealConfiguration;

    beforeAll(() => {
        webPaymentDemo = new WebPaymentDemoPage();
        idealConfiguration = new IdealConfiguration();
        browser.waitForAngularEnabled(false);
    });

    beforeEach(() => {
        browser.waitForAngular();
    });

    describe('on open Web Payment Demo', () => {

        it('should confirm environment alert', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.environmentAlert), 15000, 'environmentAlert is not present')
                .then(() => {
                    webPaymentDemo.confirmEnvironmentAlert();
                });
        });
    });

    describe('on set country and currency', () => {

        it(`should set country to "${browser.params.ideal.country}"`, () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.countryFormField), 15000, 'countryFormField is not present')
                .then(() => {
                    webPaymentDemo.setCountry(browser.params.ideal.country);
                    expect(webPaymentDemo.countryFormField.getText()).toBe(browser.params.ideal.country);
                });
        });

        it(`should set currency to "${browser.params.ideal.currency}"`, () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.currencyFormField), 15000, 'currencyFormField is not present')
                .then(() => {
                    webPaymentDemo.setCurrency(browser.params.ideal.currency);
                    expect(webPaymentDemo.currencyFormField.getText()).toBe(browser.params.ideal.currency);
                });
        });
    });

    describe('on make payment', () => {

        afterEach(() => {
            browser.sleep(200);
        });

        it('should open "Select a Payment Method" step', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.paymentStepper), 10000, 'paymentStepper is not present')
                .then(() => {
                    webPaymentDemo.clickSelectAPaymentMethod();
                    expect(webPaymentDemo.paymentSteps.get(1).getAttribute('aria-selected')).toBe('true');
                });
        });

        it('should select "iDEAL"', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.paymentMethodRadioGroup), 10000, 'paymentMethodRadioGroup is not present')
                .then(() => {
                    webPaymentDemo.selectPaymentMethod('ideal');
                });
        });

        it(`should select bank "${browser.params.ideal.bank}"`, () => {
            browser.wait(ExpectedConditions.presenceOf(idealConfiguration.bankInput), 10000, 'klarnaRadioGroup is not present')
                .then(() => {
                    idealConfiguration.selectBank(browser.params.ideal.bank);
                });
        });

        it('should click "Pay Now" button', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.payNowButton), 10000, '"Pay Now" button is not present')
                .then(() => {
                    expect(webPaymentDemo.payNowButton.isEnabled()).toBe(true, '"Pay Now" button is not enabled');
                    browser.sleep(1000);
                    webPaymentDemo.clickPayNowButton();
                });
        });

        it('should redirect to iDEAL simulator', () => {
            browser.waitForAngularEnabled(false);
            browser.wait(ExpectedConditions.urlContains('https://idealtest.secure-ing.com/ideal/issuerSim.do?trxid='), 10000, 'did not redirect to iDEAL simulator');
        });

        it('should confirm payment', () => {
            browser.wait(ExpectedConditions.presenceOf(idealConfiguration.simulatorPaymentConfirmationButton), 2000, 'simulatorPaymentConfirmationButton is not present')
                .then(() => {
                    idealConfiguration.confirmPayment();
                })
                .catch(error => {
                    console.error(error);
                });
        });

        it('should route to successful payment', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.orderDetailComponent), 20000, 'orderDetailComponent is not present')
                .then(() => {
                    webPaymentDemo.confirmEnvironmentAlert();
                });
        });

        it('should be captured', () => {
            expect(webPaymentDemo.paymentStatus.getText()).toBe('Captured');                    
        });
    });
});
