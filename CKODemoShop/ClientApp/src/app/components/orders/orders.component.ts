import { Component, ViewChild } from '@angular/core';
import { IPayment } from '../../interfaces/payment.interface';
import { MatTableDataSource, MatSort, MatSortable } from '@angular/material';
import { UserService } from '../../services/user.service';
import { PaymentsService } from 'src/app/services/payments.service';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { UserClaims } from '@okta/okta-angular';

@Component({
  selector: 'app-orders',
  templateUrl: './orders.component.html'
})
export class OrdersComponent {
  oktaUser: UserClaims;
  orders: IPayment[];
  displayedColumns: string[] = ['requestedOn', 'id', 'amount', 'status', 'source'];
  dataSource = new MatTableDataSource(this.orders);

  @ViewChild(MatSort) sort: MatSort;

  constructor(
    private _userService: UserService,
    private _paymentsService: PaymentsService,
    private _paymentDetailsService: PaymentDetailsService,
  ) {
    this._userService.oktaUser$.subscribe(oktaUser => this.oktaUser = oktaUser);
    let recordedOrders: string[] = JSON.parse(localStorage.getItem('payments'));
    if (recordedOrders !== null) {
      recordedOrders.forEach(paymentId => {
        _paymentsService.getPayment(paymentId).subscribe(response => {
          if (!this.orders) {
            this.orders = [response.body]
          } else {
            this.orders.push(response.body);
          }
          this.orders.sort((a, b) => {
            let timestampA = new Date(a.requested_on);
            let timestampB = new Date(b.requested_on);
            if (timestampA < timestampB) return -1;
            if (timestampA > timestampB) return 1;
            return 0;
          });
          this.dataSource = new MatTableDataSource(this.orders);
          this.dataSource.sort = this.sort;
        })
      });
    }    
  }

  private paymentMethodIcon(payment: IPayment): string {
    return this._paymentsService.paymentMethodIcon(payment);
  }

  private currencyBaseAmount(currencyCode: string): number {
    return this._paymentsService.currencies.find(currency => currency.iso4217 == currencyCode).base;
  }
}
