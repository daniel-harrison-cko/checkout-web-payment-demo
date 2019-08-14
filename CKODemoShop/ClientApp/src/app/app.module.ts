import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule, APP_INITIALIZER } from '@angular/core';
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
import { LoginComponent } from './components/login/login.component';
import { APP_BASE_HREF } from '@angular/common';
import { RefundPromptComponent } from './components/refund-prompt/refund-prompt.component';
import { APIInterceptor } from './services/api.interceptor';
import { Routes, RouterModule } from '@angular/router';
import { OKTA_CONFIG, OktaAuthModule, OktaCallbackComponent, OktaAuthGuard} from '@okta/okta-angular';
import { Location } from '@angular/common';
import { AppConfigService } from './services/app-config.service';

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
    path: 'login',
    component: LoginComponent
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
    LoginComponent
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
    { provide: APP_BASE_HREF, useValue: '/' },
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
