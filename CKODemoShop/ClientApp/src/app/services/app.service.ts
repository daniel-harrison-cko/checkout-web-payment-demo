import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ICurrency } from '../interfaces/currency.interface';

@Injectable({
  providedIn: 'root'
})
export class AppService {
  // Subjects
  private currencySource = new BehaviorSubject<ICurrency>({iso4217:'GBP', base: 100});

  // Observables
  public currency$ = this.currencySource.asObservable();

  // Methods
  public setCurrency(currency: ICurrency) {
    this.currencySource.next(currency);
  }
}
