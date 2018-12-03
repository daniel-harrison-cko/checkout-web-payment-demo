import { Component, ViewChild } from '@angular/core';
import { ICustomer } from '../../interfaces/customer.interface';
import { IPayment } from '../../interfaces/payment.interface';
import { MatTableDataSource, MatSort, MatSortable } from '@angular/material';
import { UserService } from '../../services/user.service';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html'
})
export class UserComponent {
  user: ICustomer;
  orders: IPayment[];
  displayedColumns: string[] = ['requestedOn', 'id', 'amount', 'status', 'source'];
  dataSource = new MatTableDataSource(this.orders);

  @ViewChild(MatSort) sort: MatSort;

  constructor(private _userService: UserService, private _orderService: OrderService) {
    this.user = _userService.getUser();
    let recordedOrders: string[] = JSON.parse(localStorage.getItem('payments'));
    if (recordedOrders !== null) {
      recordedOrders.forEach(paymentId => {
        _orderService.getOrder(paymentId).subscribe(response => {
          if (!this.orders) {
            this.orders = [response.body]
          } else {
            this.orders.push(response.body);
          }
          this.orders.sort((a, b) => {
            let timestampA = new Date(a.requestedOn);
            let timestampB = new Date(b.requestedOn);
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

  openPayment(id: string) {
    alert(id);
  }

  private orderStatus(id: number): string {
    return this._orderService.statusIdToName(id);
  }

  private paymentMethodIcon(payment: IPayment): string {
    return this._orderService.paymentMethodIcon(payment);
  }
}
