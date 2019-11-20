import { browser, by, element } from 'protractor';
import { Page } from './page.po';

export class WebPaymentDemoPage extends Page {
    paymentComponent = element(by.tagName('app-payment-component'));
    orderDetailComponent = element(by.tagName('app-order-detail'));
    paymentMethodForm = element(by.tagName('app-payment-method-form'));

    environmentAlert = element(by.tagName('app-environment-alert'));
    environmentAlertButtons = element.all(by.css('app-environment-alert button'));

    countryFormField = element(by.css('mat-toolbar mat-form-field[form-field="country"]'));
    countryOptions = element.all(by.css('mat-option.country-option'));
    currencyFormField = element(by.css('mat-toolbar mat-form-field[form-field="currency"]'));
    currencyOptions = element.all(by.css('mat-option.currency-option'));
    menuButton = element(by.css('mat-toolbar #menuButton'));
    pastOrdersButton = element(by.css('div[role="menu"] #pastOrdersButton.mat-menu-item'));
    environmentsButton = element(by.css('div[role="menu"] #environmentsButton.mat-menu-item'));
    logoutButton = element(by.css('div[role="menu"] #logoutButton.mat-menu-item'));

    paymentStepper = element(by.css('#paymentStepper'));
    paymentSteps = element.all(by.css('#paymentStepper mat-step-header'));

    paymentMethodRadioGroup = element(by.css('app-payment-method-form #payment-method-radio-group'));
    paymentMethodRadioButtons = element.all(by.css('app-payment-method-form #payment-method-radio-group mat-radio-button'));

    payNowButton = element(by.id('payNowButton'));

    paymentReference = element(by.css('app-order-detail mat-card-title'));
    paymentStatus = element(by.css('app-order-detail #status'));

    hypermedia = element(by.css('app-hypermedia'));
    hypermediaButtons = element.all(by.css('app-hypermedia button'));

    refundPrompt = element(by.css('app-refund-prompt'));
    refundAmount = element(by.css('app-refund-prompt input[ng-reflect-name="amount"]'));
    refundReference = element(by.css('app-refund-prompt input[ng-reflect-name="reference"]'));
    refundConfirmButton = element(by.css('app-refund-prompt button#refundConfirmButton'));

    confirmEnvironmentAlert() {
        return this.environmentAlertButtons.last().getWebElement().click();
    }

    setCountry(alpha2Code: string) {
        browser.waitForAngular();
        this.countryFormField.click();
        return this.countryOptions.isPresent()
            .then(() => {
                element.all(by.css(`mat-option.country-option[ng-reflect-value="${alpha2Code.toUpperCase()}"]`))
                    .getWebElements()
                    .then(countryOption => {
                        countryOption[0].click();
                    });
            })
            .catch(error => console.error(error));
    }

    setCurrency(currencyCode: string) {
        browser.waitForAngular();
        this.currencyFormField.click();
        return this.currencyOptions.isPresent()
            .then(() => {
                element.all(by.css(`mat-option.currency-option[ng-reflect-value="${currencyCode.toUpperCase()}"]`))
                    .getWebElements()
                    .then(currencyOption => {
                        currencyOption[0].click();
                    });
            })
            .catch(error => console.error(error));
    }
    
    clickCustomerDetails() {
        browser.waitForAngular();
        return this.paymentSteps.isPresent()
            .then(() => {
                let customerDetailsStep = this.paymentSteps.get(0);
                customerDetailsStep.click();
            })
            .catch(error => console.error(error));
    }

    clickSelectAPaymentMethod() {
        browser.waitForAngular()
        return this.paymentSteps.isPresent()
            .then(() => {
                let selectAPaymentMethodStep = this.paymentSteps.get(1);
                selectAPaymentMethodStep.click();
            })
            .catch(error => console.error(error));
    }

    selectPaymentMethod(paymentMethod: string) {
        browser.waitForAngular();
        this.paymentMethodRadioGroup.isPresent()
            .then(() => {
                element.all(by.css(`app-payment-method-form #payment-method-radio-group mat-radio-button[ng-reflect-value="${paymentMethod.toLowerCase()}"] label`))
                    .getWebElements()
                    .then(paymentMethods => {
                        paymentMethods[0].click();
                    });
            })
            .catch(error => console.error(error));
    }

    clickPayNowButton() {
        browser.waitForAngular();
        this.payNowButton.isEnabled()
            .then(() => {
                this.payNowButton.click();
            })
            .catch(error => console.error(error));
    }

    clickRefundButton() {
        browser.waitForAngular();
        this.hypermedia.isPresent()
            .then(() => {
                this.hypermediaButtons
                    .filter(function (element) {
                        return element.getAttribute('id')
                            .then(id => {
                                return id === 'refund';
                            });
                    })
                    .click();
            })
            .catch(error => console.error(error));
    }

    configureRefund(amount?: number, reference?: string) {
        browser.waitForAngular();
        this.refundPrompt.isPresent()
            .then(() => {
                if (amount) {
                    this.refundAmount.clear();
                    this.refundAmount.sendKeys(amount);
                }
                if (reference) {
                    this.refundReference.clear();
                    this.refundReference.sendKeys(reference);
                }
            })
            .catch(error => console.error(error));
    }

    logout() {
        browser.waitForAngular();
        this.menuButton.isPresent()
            .then(() => {
                this.menuButton.click();
                browser.sleep(200);
                this.logoutButton.click();
            })
            .catch(error => console.error(error));
    }
}
