import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ICustomer } from '../interfaces/customer.interface';

const USER: ICustomer = {
  id: '12345',
  name: 'John Doe',
  email: 'john.doe@checkout.com'
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private http: HttpClient) { }

  /*getUser(id: string): Observable<HttpResponse<ICustomer>> {
    return this.http.get<ICustomer>(`/api/checkout/customer/${id}`, {observe: 'response'});
  }*/

  getUser(): ICustomer {
    return USER;
  }
}
