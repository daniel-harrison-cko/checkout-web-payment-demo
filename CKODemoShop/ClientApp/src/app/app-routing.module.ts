import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BillingAndShippingComponent } from './components/billing-and-shipping/billing-and-shipping.component';
import { HeroesComponent } from './components/heroes/heroes.component';

const routes: Routes = [
  {
    path: '',
    component: HeroesComponent
  },
  {
    path: 'order/billing-and-shipping',
    component: BillingAndShippingComponent
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full'
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
