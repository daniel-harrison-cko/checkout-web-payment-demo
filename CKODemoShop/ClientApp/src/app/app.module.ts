import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { AppComponent } from './app.component';
import { BillingAndShippingComponent } from './components/billing-and-shipping/billing-and-shipping.component';
import { AddressFormComponent } from './components/address-form/address-form.component';
import { HeroesComponent } from './components/heroes/heroes.component';
import { HeroComponent } from './components/hero/hero.component';
import { HeroDetailComponent } from './components/hero-detail/hero-detail.component';
import { SpacesToDashesPipe } from './pipes/spaces-to-dashes.pipe';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { PaymentComponent } from './components/payment/payment.component';
import { CustomerSummaryComponent } from './components/customer-summary/customer-summary.component';
import { VerifyAndPayComponent } from './components/verify-and-pay/verify-and-pay.component';
import { OrderSummaryComponent } from './components/order-summary/order-summary.component';
import { UserComponent } from './components/user/user.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';

@NgModule({
  declarations: [
    AppComponent,
    UserComponent,
    OrderDetailComponent,
    HeroesComponent,
    HeroComponent,
    HeroDetailComponent,
    PaymentComponent,
    BillingAndShippingComponent,
    AddressFormComponent,
    VerifyAndPayComponent,
    CustomerSummaryComponent,
    OrderSummaryComponent,
    SpacesToDashesPipe
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
