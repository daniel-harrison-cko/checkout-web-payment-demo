import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { IPayment } from '../interfaces/payment.interface';
import { IProduct } from '../interfaces/product.interface';
import { ICurrency } from '../interfaces/currency.interface';

const CURRENCIES: ICurrency[] = [
  { iso4217: 'AUD', base: 100 },
  { iso4217: 'BRL', base: 100 },
  { iso4217: 'EUR', base: 100 },
  { iso4217: 'GBP', base: 100 },
  { iso4217: 'NZD', base: 100 },
  { iso4217: 'USD', base: 100 }
];

@Injectable({
  providedIn: 'root'
})

export class OrderService {
  subscriptions: Subscription[] = [];
  pointsAmount: number;
  orderData: IProduct[];

  constructor(private _http: HttpClient) {
    this.subscriptions.push(
      this.orderData$.subscribe(product => this.orderData = product)
    );
  }

  // Subjects
  orderDataSource = new BehaviorSubject<IProduct[]>([]);
  private currencySource = new BehaviorSubject<ICurrency>(CURRENCIES[0]);

  // Observables
  orderData$ = this.orderDataSource.asObservable();
  public currency$ = this.currencySource.asObservable();

  // Methods
  public setCurrency(currency: ICurrency) {
    this.currencySource.next(currency);
  }

  get currencies(): ICurrency[] {
    return CURRENCIES;
  }

  getOrder(id: string): Observable<HttpResponse<IPayment>> {
    return this._http.get<IPayment>(`/api/checkout/payments/${id}`, { observe: 'response' });
  }

  getPaymentActions(id: string): Observable<HttpResponse<any>> {
    return this._http.get<any>(`api/checkout/payments/${id}/actions`, {observe: 'response' })
  }

  paymentMethodIcon(payment: IPayment): string {
    return payment.source.type == 'card' ? (<string>payment.source["scheme"]).toLowerCase() : payment.source.type;
  }

  getOrderData(): IProduct[] {
    return this.orderData;
  }

  addOrPatchProduct(product: IProduct) {
    let currentOrderDataSource = this.orderDataSource.value;
    if (currentOrderDataSource.map(product => product.name).includes(product.name)) {
      let patchProduct = product;
      let filteredProduct = currentOrderDataSource.filter(product => product.name == patchProduct.name)[0];
      let filteredProductIndex = this.orderDataSource.value.indexOf(filteredProduct);
      this.orderDataSource.value[filteredProductIndex] = patchProduct;
      this.orderDataSource.next(this.orderDataSource.value);
    } else {
      this.orderDataSource.next(currentOrderDataSource.concat([product]));
    }
  }

  getTotal(): number {
    if (this.getOrderData()) {
      return this.getOrderData().map(t => (t.amount * t.unit)).reduce((acc, value) => acc + value, 0);
    } else {
      return 0;
    }
  }
}
