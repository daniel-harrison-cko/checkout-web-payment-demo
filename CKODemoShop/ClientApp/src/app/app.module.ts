import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER, Injectable } from '@angular/core';
import { AngularMaterialModule } from './angular-material.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS, HttpClient } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PaymentComponent } from './components/payment/payment.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { HypermediaComponent } from './components/hypermedia/hypermedia.component';
import { OrdersComponent } from './components/orders/orders.component';
import { BreadcrumbsComponent } from './components/breadcrumbs/breadcrumbs.component';
import { ProductFormComponent } from './components/product-form/product-form.component';
import { PaymentMethodFormComponent } from './components/payment-method-form/payment-method-form.component';
import { PaymentConfigurationFormComponent } from './components/payment-configuration-form/payment-configuration-form.component';
import { CustomerDetailsFormComponent } from './components/customer-details-form/customer-details-form.component';
import { LogoutComponent } from './components/logout/logout.component';
import { APP_BASE_HREF } from '@angular/common';
import { RefundPromptComponent } from './components/refund-prompt/refund-prompt.component';
import { APIInterceptor } from './services/api.interceptor';
import { Routes, RouterModule } from '@angular/router';
import { OKTA_CONFIG, OktaAuthModule, OktaCallbackComponent, OktaAuthGuard} from '@okta/okta-angular';
import {Location, LocationStrategy, PathLocationStrategy} from '@angular/common';

const routes: Routes = [
  {
    path: 'implicit/callback',
    component: OktaCallbackComponent
  },
  {
    path: '',
    component: PaymentComponent,
    canActivate: [ OktaAuthGuard ]
  },
  {
    path: 'user/orders',
    component: OrdersComponent,
    canActivate: [ OktaAuthGuard ]
  },
  {
    path: 'user/orders/:orderId',
    component: OrderDetailComponent,
    canActivate: [ OktaAuthGuard ]
  },
  {
    path: 'order/:status',
    component: OrderDetailComponent,
    canActivate: [ OktaAuthGuard ]
  },
  {
    path: 'logout',
    component: LogoutComponent
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
    canActivate: [ OktaAuthGuard ]
  }
];

@Injectable()
export class AppConfigService {
  private _config: any;

  constructor(private location: Location) { }

  async loadConfiguration() {
    
    let configUrl = this.location.prepareExternalUrl("/api/config");

    //don't really like to use window here, as it might be hard to unit-test
    //but didn't really find anything else 
    let redirectUrl = window.origin + this.location.prepareExternalUrl('/implicit/callback');
    
    //we're using fetch here instead of HttpClient, since otherwise the HttpClient interceptor kicks in,
    //initializing Okta before we can actually read the settings. 
    console.log(redirectUrl);
    let config = await (await fetch(configUrl)).json();
    
    this._config = {
      'clientId': config.client_id,
      'issuer': config.issuer,
      'redirectUri': redirectUrl
    };
  }

  public getConfig(): object {
    return this._config;
  }

  public get isLoaded(): boolean {
    return this._config != null;
  }
}

@NgModule({
  declarations: [
    AppComponent,
    OrdersComponent,
    OrderDetailComponent,
    PaymentComponent,
    HypermediaComponent,
    BreadcrumbsComponent,
    ProductFormComponent,
    PaymentConfigurationFormComponent,
    PaymentMethodFormComponent,
    CustomerDetailsFormComponent,
    RefundPromptComponent,
    LogoutComponent
  ],
  entryComponents: [
    RefundPromptComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule.forRoot(routes),
    OktaAuthModule
  ],
  providers: [
    Location,
    AppConfigService,
    {
      provide: APP_INITIALIZER,
      useFactory: (settingsService: AppConfigService) => {
        return () => {
          return settingsService.loadConfiguration()
        };
      },
      multi: true,
      deps: [AppConfigService]
    },
    { provide: APP_BASE_HREF, useValue: '/demoshop-external' },
    { 
      provide: OKTA_CONFIG, 
      useFactory: (settingsService: AppConfigService) => {
        return settingsService.getConfig();
      }, 
      deps: [AppConfigService] 
    },
    { provide: HTTP_INTERCEPTORS, useClass: APIInterceptor, multi: true }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
