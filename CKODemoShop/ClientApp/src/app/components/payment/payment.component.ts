import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { PaymentsService } from '../../services/payments.service';
import { Subscription } from 'rxjs';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  processing: boolean;

  constructor(
    private _paymentDetailsService: PaymentDetailsService,
    private _paymentService: PaymentsService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this._paymentService.processing$.pipe(distinctUntilChanged()).subscribe(processing => this.processing = processing),
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails)
    );
    this._paymentService.setReferenceIfMissing();
  }

  ngOnDestroy() {
    this._paymentService.resetPayment();
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get paymentButtonIsDisabled(): boolean {
    return this._paymentService.paymentButtonIsDisabled;
  }

  public makePayment(): void {
    this._paymentService.makePayment();
  }
}
