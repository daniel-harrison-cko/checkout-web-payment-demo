import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBank } from '../interfaces/bank.interface';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IPaymentRequest } from '../interfaces/payment-request.interface';
import { IBanks } from '../interfaces/banks.interface';
import { IPayment } from '../interfaces/payment.interface';

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

  addSource(source: any): any {
    console.log(source);
    return true;
  }

  requestPayment(paymentRequest: IPaymentRequest): Observable<HttpResponse<any>> {
    switch (paymentRequest.source.type) {
      case 'token': {
        return this.http.post<any>(`/api/checkout/payments/source/token`, paymentRequest, { observe: 'response' });
      }
      case 'card': {
        return this.http.post<any>(`/api/checkout/payments/source/card`, paymentRequest, { observe: 'response' });
      }
      default: {
        return this.http.post<any>(`/api/checkout/payments/source/alternative-payment-method`, paymentRequest, { observe: 'response' });
      }
    }
  }

  requestToken(tokenRequest: any): Observable<HttpResponse<any>> {
    return this.http.post<any>(`/api/checkout/tokens`, tokenRequest, { observe: 'response' });
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
