import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from './interfaces/currency.interface';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PaymentDetailsService } from './services/payment-details.service';
import { PaymentsService } from './services/payments.service';
import { CountriesService } from './services/countries.service';
import { ICountry } from './interfaces/country.interface';
import { distinctUntilChanged } from 'rxjs/operators';
import { WebhooksService } from './services/webhooks.service';
import { MatSlideToggleChange } from '@angular/material';

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
  webhooksForm: FormGroup;
  countries: ICountry[];

  constructor(
    private _countriesService: CountriesService,
    private _webhooksService: WebhooksService,
    private _paymentDetailsService: PaymentDetailsService,
    private _paymentsService: PaymentsService,
    private _router: Router,
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.webhooksForm = this._formBuilder.group({
      eventTypes: [null],
      webhooks: [null],
      hasWebhooks: [false, Validators.required]
    });
    this.subscriptions.push(
      this._webhooksService.getWebhooks().pipe(distinctUntilChanged()).subscribe(response => this.webhooksForm.get('webhooks').setValue(response.body)),
      this.webhooksForm.get('webhooks').valueChanges.pipe(distinctUntilChanged()).subscribe(webhooks => this.webhooksForm.get('hasWebhooks').setValue(webhooks ? true : false)),
      this._webhooksService.getEventTypes().pipe(distinctUntilChanged()).subscribe(response => this.webhooksForm.get('eventTypes').setValue((<Array<any>>response.body).find(eventTypeArray => eventTypeArray.version == "2.0").event_types)),
      this._countriesService.countries$.pipe(distinctUntilChanged()).subscribe(countries => this.countries = countries),
      this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  navigateTo = (url: string) => { this._router.navigateByUrl(url) };

  private toggleWebhooks = (event: MatSlideToggleChange) => {
    if (event.checked) {
      this._webhooksService.addWebhook(this.webhooksForm.value.eventTypes).subscribe();
    } else {
      this._webhooksService.clearWebhooks().subscribe();
    }
  };
}
