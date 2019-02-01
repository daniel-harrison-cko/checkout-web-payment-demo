import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { IBank } from '../interfaces/bank.interface';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IBanks } from '../interfaces/banks.interface';
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

export class PaymentsService {

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

  paymentMethodIcon(payment: IPayment): string {
    return payment.source.type == 'card' ? (<string>payment.source["scheme"]).toLowerCase() : payment.source.type;
  }

  redirect(response: HttpResponse<IPayment>): void {
    let payment: IPayment = response.body;
    window.location.href = payment._links.redirect.href;
  }

  getMonth(expiryDate: string): number {
    return Number.parseInt(expiryDate.slice(0, 2));
  }

  getYear(expiryDate: string): number {
    return Number.parseInt(expiryDate.slice(2, 6));
  }

  // API
  getLegacyBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBank[]>> {
    return this._http.get<IBank[]>(`/api/checkout/${paymentMethod.type}/banks`, { observe: 'response' });
  }

  getBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBanks>> {
    return this._http.get<IBanks>(`/api/checkout/${paymentMethod.type}/banks`, { observe: 'response' });
  }

  requestToken(tokenRequest: any): any {
    return this._http.post<any>(`/api/checkout/tokens/source/wallet`, tokenRequest, { observe: 'response' });
  }

  requestKlarnaSession(creditSessionRequest): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/klarna/creditSessions`, creditSessionRequest, { observe: 'response' });
  }

  getPayment(id: string): Observable<HttpResponse<IPayment>> {
    return this._http.get<IPayment>(`/api/checkout/payments/${id}`, { observe: 'response' });
  }

  requestPayment(paymentRequest: any): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/payments`, paymentRequest, { observe: 'response' });
  }

  getPaymentActions(id: string): Observable<HttpResponse<any>> {
    return this._http.get<any>(`api/checkout/payments/${id}/actions`, { observe: 'response' })
  }
}
