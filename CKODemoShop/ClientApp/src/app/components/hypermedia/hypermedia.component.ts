import { Component, Input, OnInit } from '@angular/core';
import { ILinks } from 'src/app/interfaces/links.interface';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { PaymentsService } from 'src/app/services/payments.service';

@Component({
  selector: 'app-hypermedia',
  templateUrl: './hypermedia.component.html'
})
export class HypermediaComponent implements OnInit {
  @Input() payment: IPayment;
  links: ILinks;
  actions: Object[];

  constructor(private _paymentsService: PaymentsService) { }

  ngOnInit() {
    this.links = this.payment._links;
    if (this.links.actions) {
      this._paymentsService.getPaymentActions(this.payment.id).subscribe(
        response => this.actions = response.body
      );
    }
  }
}
