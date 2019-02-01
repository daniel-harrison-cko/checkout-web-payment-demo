import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBank } from '../interfaces/bank.interface';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IBanks } from '../interfaces/banks.interface';
import { IPayment } from '../interfaces/payment.interface';

const publicKey: string = 'pk_test_3f148aa9-347a-450d-b940-0a8645b324e7';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) { }

  getLegacyBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBank[]>> {
    return this.http.get<IBank[]>(`/api/checkout/${paymentMethod.type}/banks`, { observe: 'response' });
  }

  getBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBanks>> {
    return this.http.get<IBanks>(`/api/checkout/${paymentMethod.type}/banks`, { observe: 'response' });
  }

  requestToken(tokenRequest: any): any {
    return this.http.post<any>(`/api/checkout/tokens/source/wallet`, tokenRequest, { observe: 'response' });
  }

  requestKlarnaSession(creditSessionRequest): Observable<HttpResponse<any>> {
    return this.http.post<any>(`/api/klarna/creditSessions`, creditSessionRequest, { observe: 'response' });
  }

  requestPayment(paymentRequest: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(`/api/checkout/payments`, paymentRequest, { observe: 'response' });
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
}
