import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPayment } from '../../interfaces/payment.interface';
import { finalize, distinctUntilChanged } from 'rxjs/operators';
import { PaymentsService } from 'src/app/services/payments.service';
import { WebsocketsService } from '../../services/websockets.service';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  processing: boolean = true;
  order: IPayment;
  orderNotFound: boolean;
  private subscriptions: Subscription[] = [];

  constructor(
    private _paymentsService: PaymentsService,
    private _websocketsService: WebsocketsService,
    private _activatedRoute: ActivatedRoute,
    private _ngZone: NgZone,
    private _snackBar: MatSnackBar
  ) {
    this.getPayment(true);
  }

  ngOnInit() {
    this.subscriptions.push(
      this._websocketsService.webhooksHub$.pipe(distinctUntilChanged()).subscribe(webhook => {
        this.getPayment();
        this._ngZone.run(() => this._snackBar.open('Incoming Webhook', webhook.type, { duration: 1000 }));
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    this._websocketsService.stopConnection();
  }

  public getPayment(isStartup: boolean = false) {
    this.processing = true;
    let orderId = this._activatedRoute.snapshot.params['orderId'] || this._activatedRoute.snapshot.queryParams['cko-session-id'];
    this._paymentsService.getPayment(orderId)
      .pipe(finalize(() => {
        this.processing = false;
        if (isStartup) this._websocketsService.startConnection(this.order.id);
      }))
      .subscribe(
        response => this.order = response.body,
        error => this.orderNotFound = true
      )
  }

  private paymentMethodIcon(payment: IPayment): string {
    return this._paymentsService.paymentMethodIcon(payment);
  }

  private currencyBaseAmount(currencyCode: string): number {
    return this._paymentsService.currencies.find(currency => currency.iso4217 == currencyCode).base;
  }
}
