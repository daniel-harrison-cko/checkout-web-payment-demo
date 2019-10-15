import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class QRCodeService {

  constructor(private _http: HttpClient) { }

  getQRCode(data: string): Observable<Blob> {
      return this._http.get(`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}`, {responseType: 'blob'});
  }
}
