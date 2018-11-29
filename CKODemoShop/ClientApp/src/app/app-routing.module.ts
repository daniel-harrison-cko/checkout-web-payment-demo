import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { UserComponent } from './components/user/user.component';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { PaymentComponent } from './components/payment/payment.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentComponent
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
    path: 'order/:status',
    component: OrderDetailComponent
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
