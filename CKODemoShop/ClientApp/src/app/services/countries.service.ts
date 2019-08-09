import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { ICountry } from '../interfaces/country.interface';
import { PaymentsService } from './payments.service';
import { from, BehaviorSubject } from 'rxjs';

const reduceToUniques = (value, index, self) => {
  return self.indexOf(value) === index;
};

@Injectable({
  providedIn: 'root'
})
export class CountriesService {
  private alpha2CountryCodes: string[] = this._paymentsService.paymentMethods.map(paymentMethod => paymentMethod.restrictedCurrencyCountryPairings).filter(pairing => pairing != null).map(pairing => Object.values(pairing)).flat(3).filter(reduceToUniques).sort();

  constructor(
    private _http: HttpClient,
    private _paymentsService: PaymentsService
  ) {
    from(this.getCountries()).subscribe(countries => this.setCountries(countries));
  }

  // Subjects
  private countriesSource = new BehaviorSubject<ICountry[]>(null);

  // Observables
  public countries$ = this.countriesSource.asObservable();

  // Methods
  public setCountries(countries: ICountry[]) {
    this.countriesSource.next(countries);
  }

  private getCountries = async (): Promise<ICountry[]> => {
    let countries: ICountry[] = [];
    let getCountryByAlpha2Code = async (alpha2CountryCode): Promise<any> => {
      let response = await this.getCountryByAlpha2Code(alpha2CountryCode);
      return response.ok ? response.body : null;
    }
    let getCountries = async () => {
      this.alpha2CountryCodes.push('US');
      this.alpha2CountryCodes.sort();
      for (let alpha2CountryCode of this.alpha2CountryCodes) {
        let country = await getCountryByAlpha2Code(alpha2CountryCode);
        countries.push({ alpha2Code: country.alpha2Code, name: country.name, nativeName: country.nativeName, flag: country.flag, languages: country.languages })
      }
    }
    await getCountries();
    return countries;
  }

  //API
  async getCountryByAlpha2Code(alpha2Code: string): Promise<HttpResponse<any>> {
    return await this._http.get<any>(`https://restcountries.eu/rest/v2/alpha/${alpha2Code}`, { observe: 'response' }).toPromise();
  }
}
