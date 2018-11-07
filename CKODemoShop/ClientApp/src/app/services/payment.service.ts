import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IIssuer } from '../interfaces/issuer.interface';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IPaymentRequest } from '../interfaces/payment-request.interface';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) { }

  getIssuers(paymentMethod: IPaymentMethod): Observable<HttpResponse<IIssuer[]>> {
    return this.http.get<IIssuer[]>(`/api/checkout/issuers/${paymentMethod.lppId}`, { observe: 'response' });
  }

  requestPayment(paymentRequest: IPaymentRequest): Observable<any> {
    return this.http.post<any>(`/api/checkout/payments`, paymentRequest, { observe: 'response' });
  }
}
