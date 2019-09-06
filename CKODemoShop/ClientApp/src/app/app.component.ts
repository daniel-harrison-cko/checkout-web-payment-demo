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
import { MatSlideToggleChange, MatDialog, MatDialogRef } from '@angular/material';

import { OktaAuthService } from '@okta/okta-angular';
import { Title } from '@angular/platform-browser';
import { AppConfigService } from './services/app-config.service';
import { EnvironmentAlertComponent } from './components/environment-alert/environment-alert.component';
import { IWebPaymentDemoEnvironment } from './interfaces/web-payment-demo-environment.interface';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})

export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  title: string = 'Payment Demo';
  currencies: ICurrency[] = this._paymentsService.currencies;
  paymentDetails: FormGroup;
  webhooksForm: FormGroup;
  countries: ICountry[];
  isAuthenticated: boolean;
  private environment: string;
  webPaymentDemoEnvironments: IWebPaymentDemoEnvironment[] = this._appConfigService.webPaymentDemoEnvironments;

  constructor(
    private _countriesService: CountriesService,
    private _webhooksService: WebhooksService,
    private _paymentDetailsService: PaymentDetailsService,
    private _paymentsService: PaymentsService,
    private _router: Router,
    private _formBuilder: FormBuilder,
    private _titleService: Title,
    private _appConfigService: AppConfigService,
    public oktaAuth: OktaAuthService,
    public environmentAlert: MatDialog
  ) {
    this.environment = this._appConfigService.config.environment.toLowerCase();
    this._titleService.setTitle(this.composeAppTitle());
    this.openEnvironmentAlert();
    // Subscribe to authentication state changes
    this.oktaAuth.$authenticationState.subscribe(
      (isAuthenticated: boolean)  => {
        this.isAuthenticated = isAuthenticated;
      }
    );
  }

  async ngOnInit() {
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

    // Get the authentication state for immediate use
    this.isAuthenticated = await this.oktaAuth.isAuthenticated();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  navigateTo = (url: string) => { this._router.navigateByUrl(url) };

  toggleWebhooks = (event: MatSlideToggleChange) => {
    if (event.checked) {
      this._webhooksService.addWebhook(this.webhooksForm.value.eventTypes).subscribe();
    } else {
      this._webhooksService.clearWebhooks().subscribe();
    }
  };

  logout() {
    this.oktaAuth.logout('/login');
  }

  private composeAppTitle(): string {
    let appTitle = this.title;
    if (this.environment) {
      appTitle = `${appTitle} - ${this.environment.toUpperCase()}`;
    }
    return appTitle;
  }

  private openEnvironmentAlert(): MatDialogRef<EnvironmentAlertComponent> {
    return this.environmentAlert.open(
      EnvironmentAlertComponent,
      {
        data: { environment: this.environment}
      }
    );
  }

  isAvailableEnvironment(webPaymentDemoEnvironment: IWebPaymentDemoEnvironment): boolean {
    return (!this._appConfigService.isCurrentEnvironment(webPaymentDemoEnvironment) && webPaymentDemoEnvironment.url != null);
  }

  switchEnvironment(webPaymentDemoEnvironment: IWebPaymentDemoEnvironment): void {
    this._appConfigService.switchEnvironment(webPaymentDemoEnvironment);
  }

  getWebPaymentDemoEnvironment(): IWebPaymentDemoEnvironment {
    return this._appConfigService.webPaymentDemoEnvironments.find(webPaymentDemoEnvironment => webPaymentDemoEnvironment.name.toLowerCase() == this.environment.toLowerCase());
  }
}
