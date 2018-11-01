import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AngularMaterialModule } from './angular-material.module';
import { AppComponent } from './app.component';
import { ShopComponent } from './components/shop/shop.component';
import { BillingAndShippingComponent } from './components/billing-and-shipping/billing-and-shipping.component';
import { AddressFormComponent } from './components/address-form/address-form.component';

@NgModule({
  declarations: [
    AppComponent,
    ShopComponent,
    BillingAndShippingComponent,
    AddressFormComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AngularMaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
