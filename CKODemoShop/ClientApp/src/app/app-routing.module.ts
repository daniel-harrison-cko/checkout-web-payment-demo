import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShopComponent } from './components/shop/shop.component';
import { BillingAndShippingComponent } from './components/billing-and-shipping/billing-and-shipping.component';

const routes: Routes = [
  {
    path: '',
    component: ShopComponent
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
