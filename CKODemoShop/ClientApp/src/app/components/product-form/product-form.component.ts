import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { ICurrency } from 'src/app/interfaces/currency.interface';
import { distinctUntilChanged } from 'rxjs/operators';
import { PaymentsService } from 'src/app/services/payments.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html'
})

export class ProductFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  currency: ICurrency;

  constructor(
    private _paymentsService: PaymentsService,
    private _paymentDetailsService: PaymentDetailsService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this.paymentDetails.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(currency => this.currency = this._paymentsService.currencies.find(element => element.iso4217 == currency))
    );
    this.currency = this._paymentsService.currencies.find(element => element.iso4217 == this.paymentDetails.value.currency);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
