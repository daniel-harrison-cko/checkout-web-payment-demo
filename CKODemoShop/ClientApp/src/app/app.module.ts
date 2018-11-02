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

@NgModule({
  declarations: [
    AppComponent,
    HeroesComponent,
    HeroComponent,
    HeroDetailComponent,
    BillingAndShippingComponent,
    AddressFormComponent,
    SpacesToDashesPipe
  ],
  imports: [
    HttpClientModule,
    BrowserModule,
    BrowserAnimationsModule,
    AppRoutingModule,
    AngularMaterialModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
