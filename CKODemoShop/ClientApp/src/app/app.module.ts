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
import { CustomerSummaryComponent } from './components/customer-summary/customer-summary.component';
import { VerifyAndPayComponent } from './components/verify-and-pay/verify-and-pay.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';
import { UserComponent } from './components/user/user.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { HypermediaComponent } from './components/hypermedia/hypermedia.component';

@NgModule({
  declarations: [
    AppComponent,
    UserComponent,
    OrderDetailComponent,
    PaymentComponent,
    AddressFormComponent,
    VerifyAndPayComponent,
    CustomerSummaryComponent,
    OrderSummaryComponent,
    HypermediaComponent
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
