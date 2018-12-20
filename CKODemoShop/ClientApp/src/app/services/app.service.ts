import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICurrency } from '../interfaces/currency.interface';

const CURRENCIES: ICurrency[] = [
  { iso4217: 'AUD', base: 100 },
  { iso4217: 'BRL', base: 100 },
  { iso4217: 'EUR', base: 100 },
  { iso4217: 'GBP', base: 100 },
  { iso4217: 'NZD', base: 100 },
  { iso4217: 'USD', base: 100 }
];

@Injectable({
  providedIn: 'root'
})
export class AppService {
  // Subjects
  private currencySource = new BehaviorSubject<ICurrency>(CURRENCIES[0]);

  // Observables
  public currency$ = this.currencySource.asObservable();

  // Methods
  public setCurrency(currency: ICurrency) {
    this.currencySource.next(currency);
  }

  get currencies(): ICurrency[] {
    return CURRENCIES;
  }
}
