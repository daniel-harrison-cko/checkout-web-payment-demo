import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ShopComponent } from './components/shop/shop.component';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/shop',
    pathMatch: 'full'
  },
  {
    path: 'shop',
    component: ShopComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
