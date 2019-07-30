import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  constructor(private _http: HttpClient) { }

  getReference(): Observable<HttpResponse<any>> {
    return this._http.get<string>(`/api/shop/references`, {observe: 'response'});
  }
}
