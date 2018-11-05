import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { MatSort, MatTableDataSource } from '@angular/material';
import { IProduct } from '../../interfaces/product.interface';
import { AppService } from '../../services/app.service';
import { Subscription } from 'rxjs';
import { ICurrency } from '../../interfaces/currency.interface';

const ELEMENT_DATA: IProduct[] = [
  { name: 'Points for Batman', amount: 100, unit: 1 },
  { name: 'Batarang', amount: 2, unit: 9995 }
];

@Component({
  selector: 'app-order-summary',
  templateUrl: './order-summary.component.html'
})
export class OrderSummaryComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  displayedColumns: string[] = ['name', 'amount', 'unit', 'total'];
  dataSource = new MatTableDataSource(ELEMENT_DATA);
  currency: ICurrency;

  @ViewChild(MatSort) sort: MatSort;

  constructor(private appService: AppService) { }

  ngOnInit() {
    this.dataSource.sort = this.sort;
    this.subscriptions.push(
      this.appService.currency$.subscribe(currency => this.currency = currency)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  getTotalCost() {
    return ELEMENT_DATA.map(t => (t.amount * t.unit)).reduce((acc, value) => acc + value, 0);
  }
}
