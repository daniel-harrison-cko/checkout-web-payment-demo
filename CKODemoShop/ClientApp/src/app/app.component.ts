import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from './interfaces/currency.interface';
import { AppService } from './services/app.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

const CURRENCIES: ICurrency[] = [
  { iso4217: 'GBP', base: 100 },
  { iso4217: 'EUR', base: 100 },
  { iso4217: 'USD', base: 100 }
];

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  title: string = 'Hall of Heroes';
  currencies: ICurrency[] = CURRENCIES;
  selectedCurrency: ICurrency;
  currencyForm: FormGroup;

  constructor(private _appService: AppService, private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.selectedCurrency = this.currencies[1];
    this.currencyForm = this._formBuilder.group({
      currency: [this.selectedCurrency, Validators.required]
    });
    this.subscriptions.push(
      this._appService.currency$.subscribe(currency => this.selectedCurrency = currency),
      //this.currencyForm.valueChanges.subscribe(currency => this._appService.setCurrency(currency)) // TODO: debug selection of currency
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
