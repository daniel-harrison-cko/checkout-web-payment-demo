import { by, element } from 'protractor';
import { Page } from './page.po';

export class OxxoConfiguration extends Page {
    simulatorPaymentConfirmationButton = element(by.buttonText('Pay'));
    simulatorPaymentExpirationButton = element(by.buttonText('Expire'));
    simulatorPaymentReturnToMerchantButton = element(by.buttonText('Return'));
    approvedLabel = element(by.css('label.approved-label'));

    confirmPayment() {
        return this.simulatorPaymentConfirmationButton.isPresent()
            .then(() => {
                this.simulatorPaymentConfirmationButton.click();
            })
            .catch(error => {
                console.error(error);
            });
    }

    returnToMerchant() {
      return this.simulatorPaymentReturnToMerchantButton.isPresent()
        .then(() => {
          this.simulatorPaymentReturnToMerchantButton.click();
        })
        .catch(error => {
          console.error(error);
        });
    }
}
