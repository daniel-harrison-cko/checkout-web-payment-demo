import { browser, by, element, ExpectedConditions, WebElement } from 'protractor';
import { Page } from './page.po';
import { protractor } from 'protractor/built/ptor';

export class KlarnaConfiguration extends Page {
    klarnaRadioGroup = element(by.css('mat-radio-group.klarna-radio-group'));
    klarnaRadioButtons = element.all(by.css('mat-radio-group.klarna-radio-group mat-radio-button'));
    klarnaIFrameWidget = element(by.id('klarna-klarna-payments-instance-fullscreen'));
    dateOfBirth: WebElement;
    purchaseApprovalButton: WebElement;
    hypermedia = element(by.css('app-hypermedia'));
    hypermediaButtons = element.all(by.css('app-hypermedia button'));

    getKlarnaIFrameWidgetElements() {
        let flow = protractor.promise.controlFlow();
        return flow.execute(() => {
            browser.switchTo().frame(element(by.id('klarna-klarna-payments-instance-fullscreen')).getWebElement());
            let purchaseApprovalContainer = element(by.id('purchase-approval__container'));
            browser.wait(ExpectedConditions.presenceOf(purchaseApprovalContainer), 5000, 'purchaseApprovalContainer is not present')
                .then(() => {
                    element(by.id('purchase-approval-date-of-birth')).getWebElement().then(element => this.dateOfBirth = element);
                    element(by.id('purchase-approval-continue')).getWebElement().then(element => this.purchaseApprovalButton = element);
                });
        });
    }

    selectPayLater() {
        browser.waitForAngular();
        this.klarnaRadioGroup.isPresent()
            .then(() => {
                this.klarnaRadioButtons
                    .filter(function (element) {
                        return element.getAttribute('ng-reflect-value')
                            .then(ngReflectValue => {
                                return ngReflectValue === 'pay_later';
                            });
                    })
                    .click();
            })
            .catch(error => console.error(error));
    }

    selectPayOverTime() {
        browser.waitForAngular();
        this.klarnaRadioGroup.isPresent()
            .then(() => {
                this.klarnaRadioButtons
                    .filter(function (element) {
                        return element.getAttribute('ng-reflect-value')
                            .then(ngReflectValue => {
                                return ngReflectValue === 'pay_over_time';
                            });
                    })
                    .click();
            })
            .catch(error => console.error(error));
    }

    capturePayment() {
        browser.waitForAngular();
        this.hypermedia.isPresent()
            .then(() => {
                this.hypermediaButtons
                    .filter(function (element) {
                        return element.getAttribute('id')
                            .then(id => {
                                return id === 'klarna:payment-capture';
                            });
                    })
                    .click();
            })
            .catch(error => console.error(error));
    }
}
