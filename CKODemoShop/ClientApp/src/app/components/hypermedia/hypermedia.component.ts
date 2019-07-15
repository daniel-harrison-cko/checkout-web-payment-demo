import { Component, Input, OnInit } from '@angular/core';
import { ILinks } from 'src/app/interfaces/links.interface';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { PaymentsService } from 'src/app/services/payments.service';
import { HypermediaRequest } from './hypermedia-request';
import { MatDialog } from '@angular/material';
import { ICurrency } from '../../interfaces/currency.interface';
import { RefundPromptComponent } from '../refund-prompt/refund-prompt.component';

export interface DialogData {
  amount: number;
  currency: ICurrency;
  reference: string;
}

@Component({
  selector: 'app-hypermedia',
  templateUrl: './hypermedia.component.html'
})
export class HypermediaComponent implements OnInit {
  @Input() payment: IPayment;
  links: ILinks;
  actions: Object[];

  constructor(
    private _paymentsService: PaymentsService,
    public dialog: MatDialog
  ) { }

  ngOnInit() {
    this.links = this.payment._links;
    if (this.links.actions) {
      this._paymentsService.getPaymentActions(this.payment.id).subscribe(
        response => this.actions = response.body
      );
    }
  }

  private openDialog(): void {
    const dialogRef = this.dialog.open(
      RefundPromptComponent,
      {
        width: '300px',
        data: { amount: this.payment.amount, reference: this.payment.reference, currency: this._paymentsService.currencies.find(currency => currency.iso4217 == this.payment.currency)}
      }
    );
    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed');
      console.log(result);
    });
  }

  private initiateHypermediaAction(relation: string, link: string) {
    if (relation == 'refund') {
      this.openDialog();
    }
    let hypermediaRequest = new HypermediaRequest(this.payment.source.type, relation, link);
    this._paymentsService.performHypermediaAction(hypermediaRequest).subscribe(
      response => location.reload(true),
      error => {
        console.warn(error);
        location.reload(true);
      }
    );
  }
}
