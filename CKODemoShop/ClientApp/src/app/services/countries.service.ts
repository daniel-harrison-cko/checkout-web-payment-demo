import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  constructor(private http: HttpClient) { }

  async getCountryByAlpha2Code(alpha2Code: string): Promise<HttpResponse<any>> {
    return await this.http.get<any>(`https://restcountries.eu/rest/v2/alpha/${alpha2Code}`, { observe: 'response' }).toPromise();
  }
}
