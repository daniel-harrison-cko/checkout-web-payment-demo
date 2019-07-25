import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from './interfaces/currency.interface';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PaymentDetailsService } from './services/payment-details.service';
import { PaymentsService } from './services/payments.service';
import { CountriesService } from './services/countries.service';
import { ICountry } from './interfaces/country.interface';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  title: string = 'CKO Demo';
  currencies: ICurrency[] = this._paymentsService.currencies;
  paymentDetails: FormGroup;
  countries: ICountry[];


  constructor(
    private _countriesService: CountriesService,
    private _paymentDetailsService: PaymentDetailsService,
    private _paymentsService: PaymentsService,
    private _router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this._countriesService.countries$.pipe(distinctUntilChanged()).subscribe(countries => this.countries = countries),
      this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  navigateTo = (url: string) => { this._router.navigateByUrl(url) };
}
