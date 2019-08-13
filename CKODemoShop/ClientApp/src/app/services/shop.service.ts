import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ShopService {
  public publicKey: string;

  constructor(private _http: HttpClient) {
    this.getPublicKey().pipe(take(1)).subscribe(response => this.publicKey = response.body.public_key);
  }

  getReference(): Observable<HttpResponse<any>> {
    return this._http.get<string>(`/api/shop/references`, {observe: 'response'});
  }

  private getPublicKey(): Observable<HttpResponse<any>> {
    return this._http.get<string>(`/api/config/publickey`, { observe: 'response' });
  }
}
