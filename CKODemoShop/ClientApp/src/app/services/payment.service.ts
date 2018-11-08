import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IBank } from '../interfaces/bank.interface';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IPaymentRequest } from '../interfaces/payment-request.interface';
import { IBanks } from '../interfaces/banks.interface';
import { IPending } from '../interfaces/pending.interface';
import { IPaymentResponse } from '../interfaces/payment-response.interface';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) { }

  getLegacyBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBank[]>> {
    return this.http.get<IBank[]>(`/api/checkout/${paymentMethod.lppId}/banks`, { observe: 'response' });
  }

  getBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBanks>> {
    return this.http.get<IBanks>(`/api/checkout/${paymentMethod.lppId}/banks`, { observe: 'response' });
  }

  requestPayment(paymentRequest: IPaymentRequest): Observable<HttpResponse<any>> {
    return this.http.post<any>(`/api/checkout/payments`, paymentRequest, { observe: 'response' });
  }

  redirect(response: HttpResponse<IPaymentResponse>): void {
    let pending: IPending = response.body.pending;
    window.location.href = pending._links.redirect.href;
  }
}
