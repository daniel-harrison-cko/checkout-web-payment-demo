import { Component, Input, OnInit } from '@angular/core';
import { ILinks } from 'src/app/interfaces/links.interface';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { PaymentsService } from 'src/app/services/payments.service';
import { HypermediaRequest } from './hypermedia-request';

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

  private initiateHypermediaAction(relation: string, link: string) {
    let hypermediaRequest = new HypermediaRequest(relation, link);
    this._paymentsService.performHypermediaAction(hypermediaRequest).subscribe(
      response => location.reload(true),
      error => console.warn(error)
    );
  }
}
