import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSort, MatTableDataSource } from '@angular/material';
import { AppService } from '../../services/app.service';
import { Subscription } from 'rxjs';
import { ICurrency } from '../../interfaces/currency.interface';
import { OrderService } from 'src/app/services/order.service';
import { IProduct } from 'src/app/interfaces/product.interface';

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html'
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  displayedColumns: string[] = ['name', 'amount', 'unit', 'total'];
  dataSource: MatTableDataSource<IProduct> = this.getDataSource();
  currency: ICurrency;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private _appService: AppService, private _orderService: OrderService) { }

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.subscriptions.push(
      this._appService.currency$.subscribe(currency => this.currency = currency),
      this._orderService.orderData$.subscribe(_ => this.dataSource = this.getDataSource())
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  getDataSource(): MatTableDataSource<IProduct> {
    return new MatTableDataSource(this._orderService.getOrderData());
  }

  getTotalCost(): number {
    return this._orderService.getTotal(); 
  }
}
