import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { IPayment } from '../../interfaces/payment.interface';

const STATUS: string[] = [
  "Authorized",
  "Cancelled",
  "Captured",
  "Declined",
  "Expired",
  "Partially Captured",
  "Partially Refunded",
  "Pending",
  "Refunded",
  "Voided",
  "Card Verified",
  "Chargeback"
];

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent {
  orderId: string;
  order: IPayment;

  constructor(orderService: OrderService, activatedRoute: ActivatedRoute) {
    this.orderId = activatedRoute.snapshot.params['orderId'];
    orderService.getOrder(this.orderId).subscribe(
      response => this.order = response.body,
      error => console.error(error)
    )
  }

  private orderStatus(id: number): string {
    return STATUS[id];
  }
}
