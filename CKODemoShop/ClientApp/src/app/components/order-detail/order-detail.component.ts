import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPayment } from '../../interfaces/payment.interface';
import { finalize } from 'rxjs/operators';
import { PaymentsService } from 'src/app/services/payments.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent {
  processing: boolean = true;
  order: IPayment;
  orderNotFound: boolean;

  constructor(
    private _paymentsService: PaymentsService,
    private _activatedRoute: ActivatedRoute
  ) {
    this.getPayment();
  }

  public getPayment() {
    let orderId = this._activatedRoute.snapshot.params['orderId'] || this._activatedRoute.snapshot.queryParams['cko-session-id'];
    this._paymentsService.getPayment(orderId)
      .pipe(finalize(() => this.processing = false))
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
