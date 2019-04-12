import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';

@Component({
  selector: 'app-customer-details-form',
  templateUrl: './customer-details-form.component.html'
})

export class CustomerDetailsFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  shippingToBilling: boolean = true;

  constructor(
    private _paymentDetailsService: PaymentDetailsService
  ) { }

  ngOnInit() {    
    this.subscriptions.push(
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this.paymentDetails.valueChanges.pipe(distinctUntilChanged()).subscribe(_ => this._paymentDetailsService.updatePaymentDetails(this.paymentDetails)),
      this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.paymentDetails.get('billing_address.address_line1').setValue(customerName)),
      this.paymentDetails.get('billing_address').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.shippingToBilling)).subscribe(address => this.paymentDetails.get('shipping.address').setValue(address))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private addShippingAddress(): void {
    this.paymentDetails.get('shipping.address').reset();
    this.shippingToBilling = false;
  }

  private removeShippingAddress(): void {
    this.paymentDetails.get('shipping.address').setValue(this.paymentDetails.get('billing_address').value);
    this.shippingToBilling = true;
  }
}
