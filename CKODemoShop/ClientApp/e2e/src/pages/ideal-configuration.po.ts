import { browser, by, element } from 'protractor';
import { Page } from './page.po';

export class IdealConfiguration extends Page {
    bankInput = element(by.css('mat-form-field[form-field="ideal_bank"] input'));
    bankOptions = element.all(by.css('mat-option.bank'));
    simulatorPaymentConfirmationButton = element(by.css('form input[type="submit"]'));

    selectBank(bank: string) {
        browser.waitForAngular();
        return this.bankInput.isPresent()
            .then(() => {
                this.bankInput.sendKeys(bank);
                this.bankOptions.first().click();
            })
            .catch(error => {
                console.error(error);
            });

    }

    confirmPayment() {
        return this.simulatorPaymentConfirmationButton.isPresent()
            .then(() => {
                this.simulatorPaymentConfirmationButton.click();
            })
            .catch(error => {
                console.error(error);
            });
    }
}
