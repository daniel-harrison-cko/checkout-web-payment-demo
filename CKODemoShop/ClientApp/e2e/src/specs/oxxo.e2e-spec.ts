import { browser, ExpectedConditions } from 'protractor';
import { WebPaymentDemoPage } from '../pages/web-payment-demo-page.po';
import { LoginPage } from '../pages/login-page.po';
import { OxxoConfiguration } from '../pages/oxxo-configuration.po';

describe('OXXO', () => {
    let webPaymentDemo: WebPaymentDemoPage;
    let loginPage: LoginPage;
    let oxxoConfiguration: OxxoConfiguration;

    beforeAll(() => {
        webPaymentDemo = new WebPaymentDemoPage();
        loginPage = new LoginPage();
        oxxoConfiguration = new OxxoConfiguration();
        browser.waitForAngularEnabled(false);
        webPaymentDemo.navigateTo('/');
    });

    beforeEach(() => {
        browser.waitForAngular();
    });

    describe('on login', () => {

        it('should route to Okta login', () => {
            browser.wait(ExpectedConditions.urlContains(browser.params.okta.domain), 5000, 'did not route to Okta login');
        });

        it('should succeed login with demo account', () => {
            loginPage.login();
        });

        it('should confirm environment alert', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.environmentAlert), 15000, 'environmentAlert is not present')
                .then(() => {
                    webPaymentDemo.confirmEnvironmentAlert();
                });
        });
    });

    describe('on set country and currency', () => {

        it(`should set country to "${browser.params.oxxo.country}"`, () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.countryFormField), 15000, 'countryFormField is not present')
                .then(() => {
                    webPaymentDemo.setCountry(browser.params.oxxo.country);
                    expect(webPaymentDemo.countryFormField.getText()).toBe(browser.params.oxxo.country);
                });
        });

        it(`should set currency to "${browser.params.oxxo.currency}"`, () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.currencyFormField), 15000, 'currencyFormField is not present')
                .then(() => {
                    webPaymentDemo.setCurrency(browser.params.oxxo.currency);
                    expect(webPaymentDemo.currencyFormField.getText()).toBe(browser.params.oxxo.currency);
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

        it('should select "OXXO"', () => {
            browser.wait(ExpectedConditions.presenceOf(webPaymentDemo.paymentMethodRadioGroup), 10000, 'paymentMethodRadioGroup is not present')
              .then(() => {
                browser.sleep(200);
                  webPaymentDemo.selectPaymentMethod('oxxo');
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

        it('should redirect to OXXO simulator', () => {
            browser.waitForAngularEnabled(false);
          browser.wait(ExpectedConditions.urlContains('https://sandbox.dlocal.com/test-payments/'), 10000, 'did not redirect to OXXO simulator');
        });

        it('should confirm payment', () => {
            browser.wait(ExpectedConditions.presenceOf(oxxoConfiguration.simulatorPaymentConfirmationButton), 2000, 'simulatorPaymentConfirmationButton is not present')
                .then(() => {
                    oxxoConfiguration.confirmPayment();
                })
                .catch(error => {
                    console.error(error);
                });
            browser.wait(ExpectedConditions.presenceOf(oxxoConfiguration.approvedLabel), 2000, 'approvedLabel is not present')
                .then(() => {
                  oxxoConfiguration.returnToMerchant();
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

    describe('on make refund', () => {

        beforeEach(() => {
            browser.waitForAngular();
        });

        afterEach(() => {
            browser.sleep(200);
        });

        afterAll(() => {
            browser.sleep(3000);
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
            if (browser.params.oxxo.deferredRefund) {

            } else {
                expect(webPaymentDemo.paymentStatus.getText()).toBe('Refunded');
            }
        });
    });

    describe('on logout', () => {

        it('should log out', () => {
            webPaymentDemo.logout();
            browser.wait(ExpectedConditions.urlContains('/login'), 10000, 'logout was unsuccessful');
        });
    });
});
