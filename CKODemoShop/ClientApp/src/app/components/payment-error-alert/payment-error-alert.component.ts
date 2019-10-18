import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';

export interface IApiException {
  paymentErrorResponse: any;
  status: number;
  statusText: string;
}

@Component({
  selector: 'app-payment-error-alert',
  templateUrl: './payment-error-alert.component.html',
})
export class PaymentErrorAlertComponent {

  constructor(
    public environmentAlertRef: MatDialogRef<PaymentErrorAlertComponent>,
    @Inject(MAT_DIALOG_DATA) public httpErrorResponse: IApiException
  ) {
      console.log(httpErrorResponse);
  }

  onClick(): void {
    this.environmentAlertRef.close();
  }
}
