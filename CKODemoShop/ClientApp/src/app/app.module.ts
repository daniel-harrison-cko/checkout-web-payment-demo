import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { AppComponent } from './app.component';
import { AddressFormComponent } from './components/address-form/address-form.component';
import { HttpClientModule } from '@angular/common/http';
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

@NgModule({
  declarations: [
    AppComponent,
    OrdersComponent,
    OrderDetailComponent,
    PaymentComponent,
    AddressFormComponent,
    HypermediaComponent,
    BreadcrumbsComponent,
    ProductFormComponent,
    PaymentConfigurationFormComponent,
    PaymentMethodFormComponent,
    CustomerDetailsFormComponent
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AngularMaterialModule,
    FormsModule,
    ReactiveFormsModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
