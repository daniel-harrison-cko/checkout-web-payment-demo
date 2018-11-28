import { Component, Input, OnInit } from '@angular/core';
import { ILinks } from 'src/app/interfaces/links.interface';
import { OrderService } from 'src/app/services/order.service';
import { IPayment } from 'src/app/interfaces/payment.interface';

@Component({
  selector: 'app-hypermedia',
  templateUrl: './hypermedia.component.html'
})
export class HypermediaComponent implements OnInit {
  @Input() payment: IPayment;
  links: ILinks;
  actions: Object[];

  constructor(private _orderService: OrderService) { }

  ngOnInit() {
    this.links = this.payment._links;
    if (this.links.actions) {
      this._orderService.getPaymentActions(this.payment.id).subscribe(
        response => this.actions = response.body
      );
    }
  }
}
