import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IIssuer } from '../interfaces/issuer.interface';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IPaymentRequestModel } from '../interfaces/payment-request-model.interface';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  constructor(private http: HttpClient) { }

  getIssuers(paymentMethod: IPaymentMethod): Observable<HttpResponse<IIssuer[]>> {
    return this.http.get<IIssuer[]>(`/api/checkout/issuers/${paymentMethod.lppId}`, { observe: 'response' });
  }

  requestPayment(paymentRequestModel: IPaymentRequestModel): Observable<any> {
    console.info(paymentRequestModel);
    return this.http.post<any>(`/api/checkout/payments`, paymentRequestModel, { observe: 'response' });
  }
}
