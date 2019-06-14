import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Subscription, from } from 'rxjs';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';
import { PaymentsService } from 'src/app/services/payments.service';
import { ICountry } from 'src/app/interfaces/country.interface';
import { CountriesService } from 'src/app/services/countries.service';

const reduceToUniques = (value, index, self) => {
  return self.indexOf(value) === index;
};

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
  private alpha2CountryCodes: string[] = this._paymentsService.paymentMethods.map(paymentMethod => paymentMethod.restrictedCurrencyCountryPairings).filter(pairing => pairing != null).map(pairing => Object.values(pairing)).flat(3).filter(reduceToUniques).sort();

  constructor(
    private _paymentDetailsService: PaymentDetailsService,
    private _paymentsService: PaymentsService,
    private _countriesService: CountriesService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      from(this.getCountries()).subscribe(countries => this.countries = countries),
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

  private getCountries = async (): Promise<ICountry[]> => {
    let countries: ICountry[] = [];
    let getCountryByAlpha2Code = async (alpha2CountryCode): Promise<any> => {
      let response = await this._countriesService.getCountryByAlpha2Code(alpha2CountryCode);
      return response.ok ? response.body : null;
    }
    let getCountries = async () => {
      this.alpha2CountryCodes.push('US');
      this.alpha2CountryCodes.sort();
      for (let alpha2CountryCode of this.alpha2CountryCodes) {
        let country = await getCountryByAlpha2Code(alpha2CountryCode);
        countries.push({ alpha2Code: country.alpha2Code, name: country.nativeName, flag: country.flag })
      }
    }
    await getCountries();
    return countries;
  }
}
