import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IPayment } from '../interfaces/payment.interface';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  constructor(private http: HttpClient) { }

  getOrder(id: string): Observable<HttpResponse<IPayment>> {
    return this.http.get<IPayment>(`/api/checkout/payments/${id}`, { observe: 'response' });
  }
}
