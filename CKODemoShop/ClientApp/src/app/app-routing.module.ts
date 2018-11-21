import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { BillingAndShippingComponent } from './components/billing-and-shipping/billing-and-shipping.component';
import { HeroesComponent } from './components/heroes/heroes.component';
import { HeroDetailComponent } from './components/hero-detail/hero-detail.component';
import { UserComponent } from './components/user/user.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';

const routes: Routes = [
  {
    path: '',
    component: HeroesComponent
  },
  {
    path: 'hero/:name',
    component: HeroDetailComponent
  },
  {
    path: 'user',
    component: UserComponent
  },
  {
    path: 'user/order/:orderId',
    component: OrderDetailComponent
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
