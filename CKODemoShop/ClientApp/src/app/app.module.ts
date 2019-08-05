import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { AngularMaterialModule } from './angular-material.module';
import { AppComponent } from './app.component';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
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

import {
  OKTA_CONFIG,
  OktaAuthModule,
  OktaCallbackComponent,
  OktaAuthGuard
} from '@okta/okta-angular';

const oktaConfig = {
  issuer: 'https://dev-320726.okta.com/oauth2/default',
  redirectUri: 'http://localhost:5000/demoshop-external/implicit/callback',
  clientId: '0oa11suy0u5Ec7Lg9357'
}

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
    { provide: APP_BASE_HREF, useValue: '/demoshop-external' },
    { provide: HTTP_INTERCEPTORS, useClass: APIInterceptor, multi: true },
    { provide: OKTA_CONFIG, useValue: oktaConfig }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
