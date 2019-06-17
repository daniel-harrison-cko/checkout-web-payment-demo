import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription, from } from 'rxjs';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { PaymentsService } from 'src/app/services/payments.service';
import { ICountry } from 'src/app/interfaces/country.interface';
import { CountriesService } from 'src/app/services/countries.service';

@Component({
  selector: 'app-customer-details-form',
  templateUrl: './customer-details-form.component.html'
})

export class CustomerDetailsFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  customer: FormGroup;
  shippingToBilling: boolean = true;
  countries: ICountry[];

  constructor(
    private _paymentDetailsService: PaymentDetailsService,
    private _countriesService: CountriesService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this._countriesService.countries$.pipe(distinctUntilChanged()).subscribe(countries => this.countries = countries),
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this._paymentDetailsService.customer$.pipe(distinctUntilChanged()).subscribe(customerFullName => this.customer = customerFullName),
      this.paymentDetails.valueChanges.pipe(distinctUntilChanged()).subscribe(_ => this._paymentDetailsService.updatePaymentDetails(this.paymentDetails)),
      this.customer.valueChanges.pipe(distinctUntilChanged()).subscribe(customer => this.updateCustomerName(customer)),
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

  private updateCustomerName(customer: any) {
    this.paymentDetails.get('customer.name').setValue(`${customer.given_name} ${customer.family_name}`);
    this._paymentDetailsService.updateCustomer(this.customer);
  }
}
