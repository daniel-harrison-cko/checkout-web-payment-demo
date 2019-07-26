import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class WebhooksService {
  constructor(private _http: HttpClient) { }

  getEventTypes(): Observable<HttpResponse<any>> {
    return this._http.get<any>(`/api/checkout/eventTypes`, { observe: 'response' });
  }

  getWebhooks(): Observable<HttpResponse<any>> {
    return this._http.get<any>(`/api/checkout/webhooks`, { observe: 'response' });
  }

  addWebhook(eventTypes: string[]): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/webhooks`, eventTypes, { observe: 'response' });
  }

  clearWebhooks(): Observable<HttpResponse<any>> {
    return this._http.delete<any>(`/api/checkout/webhooks`, { observe: 'response' });
  }
}
