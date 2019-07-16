import { Component, Input, OnInit } from '@angular/core';
import { ILinks } from 'src/app/interfaces/links.interface';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { PaymentsService } from 'src/app/services/payments.service';
import { HypermediaRequest } from './hypermedia-request';
import { MatDialog, MatDialogRef } from '@angular/material';
import { ICurrency } from '../../interfaces/currency.interface';
import { RefundPromptComponent } from '../refund-prompt/refund-prompt.component';
import { Subject, Subscription } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

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
  subscriptions: Subscription[] = [];

  constructor(
    private _paymentsService: PaymentsService,
    public dialog: MatDialog
  ) { }

  private hypermediaRequestSource = new Subject();
  private hypermediaRequest$ = this.hypermediaRequestSource.asObservable();
  private createHypermediaRequest(hypermediaRequest: HypermediaRequest) {
    this.hypermediaRequestSource.next(hypermediaRequest);
  }

  ngOnInit() {
    this.links = this.payment._links;
    if (this.links.actions) {
      this._paymentsService.getPaymentActions(this.payment.id).subscribe(
        response => this.actions = response.body
      );
    }
    this.subscriptions.push(
      this.hypermediaRequest$.pipe(distinctUntilChanged()).subscribe((hypermediaRequest: HypermediaRequest) => this.makeHypermediaRequest(hypermediaRequest))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private openDialog(): MatDialogRef<RefundPromptComponent> {
    return this.dialog.open(
      RefundPromptComponent,
      {
        width: '80%',
        maxWidth: '500px',
        data: { amount: this.payment.amount, reference: this.payment.reference, currency: this._paymentsService.currencies.find(currency => currency.iso4217 == this.payment.currency)}
      }
    );
  }

  private initiateHypermediaAction(relation: string, link: string) {
    switch (relation) {
      case 'refund': {
        const dialogRef = this.openDialog();
        dialogRef.afterClosed().subscribe(result => {
          if (result) {
            this.createHypermediaRequest(new HypermediaRequest(
              this.payment.source.type,
              relation,
              link,
              {
                amount: result.amount,
                reference: result.reference,
                metadata: null
              }
            ));
          }
        });
        break;
      }
      case 'klarna:payment-capture': {
        this.createHypermediaRequest(new HypermediaRequest(
          this.payment.source.type,
          relation,
          link,
          {
            reference: 'Klarna Test Capture',
            metadata: null,
            type: 'klarna',
            klarna: {
              description: 'Klarna Data Description',
              products: [],
              shipping_info: [],
              shipping_delay: 0
            }
          }
        ));
        break;
      }
      case 'klarna:payment-void': {
        this.createHypermediaRequest(new HypermediaRequest(
          this.payment.source.type,
          relation,
          link,
          {
            reference: 'Klarna Test Void',
            metadata: null
          }
        ));
        break;
      }
      default: {
        this.createHypermediaRequest(new HypermediaRequest(this.payment.source.type, relation, link));
        break;
      }
    }
  }

  private makeHypermediaRequest(hypermediaRequest: HypermediaRequest) {
    this._paymentsService.performHypermediaAction(hypermediaRequest).subscribe(
      response => location.reload(true),
      error => {
        console.warn(error);
        location.reload(true);
      }
    );
  }
}
