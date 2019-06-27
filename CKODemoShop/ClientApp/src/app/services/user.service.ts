import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICustomer } from '../interfaces/customer.interface';

const USER: ICustomer = {
  id: '12345',
  name: 'Bruce Wayne',
  email: 'bruce@wayne-enterprises.com'
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private _http: HttpClient) { }

  /*getUser(id: string): Observable<HttpResponse<any>> {
    return this._http.get<ICustomer>(`/api/checkout/customer/${id}`, {observe: 'response'});
  }*/

  getUser(): ICustomer {
    return USER;
  }
}
