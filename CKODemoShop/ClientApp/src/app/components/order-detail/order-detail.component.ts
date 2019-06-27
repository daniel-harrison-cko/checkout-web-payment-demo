import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { IPayment } from '../../interfaces/payment.interface';
import { finalize } from 'rxjs/operators';
import { PaymentsService } from 'src/app/services/payments.service';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html'
})
export class OrderDetailComponent {
  loading: boolean = true;
  order: IPayment;
  orderNotFound: boolean;


  constructor(
    private _paymentsService: PaymentsService,
    private _paymentDetailsService: PaymentDetailsService,
    private _activatedRoute: ActivatedRoute
  ) {
    let orderId = _activatedRoute.snapshot.params['orderId'] || _activatedRoute.snapshot.queryParams['cko-session-id'];
    _paymentsService.getPayment(orderId)
      .pipe(
        finalize(() => this.loading = false)
      )
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
