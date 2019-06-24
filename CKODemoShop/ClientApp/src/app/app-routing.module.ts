import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { OrderDetailComponent } from './components/order-detail/order-detail.component';
import { PaymentComponent } from './components/payment/payment.component';
import { OrdersComponent } from './components/orders/orders.component';

const routes: Routes = [
  {
    path: '',
    component: PaymentComponent
  },
  {
    path: 'user/orders',
    component: OrdersComponent
  },
  {
    path: 'user/orders/:orderId',
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
