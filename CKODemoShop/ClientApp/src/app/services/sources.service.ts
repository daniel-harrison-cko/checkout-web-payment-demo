import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SourcesService {
  constructor(private http: HttpClient) { }

  requestSource(source: any): Observable<HttpResponse<any>> {
    return this.http.post<any>('/api/checkout/sources', source, { observe: 'response' });
  }
}
