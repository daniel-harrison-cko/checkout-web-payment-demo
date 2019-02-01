import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { IPayment } from '../interfaces/payment.interface';
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
  constructor(private _http: HttpClient) { }

  // Subjects
  private currencySource = new BehaviorSubject<ICurrency>(CURRENCIES[0]);

  // Observables
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
}
