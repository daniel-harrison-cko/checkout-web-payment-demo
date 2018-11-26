import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { IPayment } from '../../interfaces/payment.interface';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent {
  loading: boolean = true;
  order: IPayment;
  orderNotFound: boolean;


  constructor(private _orderService: OrderService, private _activatedRoute: ActivatedRoute) {
    let orderId = _activatedRoute.snapshot.params['orderId'] || _activatedRoute.snapshot.queryParams['cko-session-id'];
    _orderService.getOrder(orderId)
      .pipe(
        finalize(() => this.loading = false)
      )
      .subscribe(
      response => this.order = response.body,
      error => this.orderNotFound = true
    )
  }

  private orderStatus(id: number): string {
    return this._orderService.statusIdToName(id);
  }

  private paymentMethodIcon(payment: IPayment): string {
    return this._orderService.paymentMethodIcon(payment);
  }

  private getHypermedia(href: string) {
    alert(href);
  }
}
