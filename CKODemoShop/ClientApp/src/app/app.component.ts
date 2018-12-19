import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from './interfaces/currency.interface';
import { AppService } from './services/app.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  title: string = 'CKO Demo';
  currencies: ICurrency[] = this._appService.currencies;
  selectedCurrency: ICurrency;
  currencyForm: FormGroup;

  constructor(private _appService: AppService, private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.selectedCurrency = this.currencies[0];
    this.currencyForm = this._formBuilder.group({
      currency: [this.selectedCurrency, Validators.required]
    });
    this.subscriptions.push(
      this._appService.currency$.subscribe(currency => this.selectedCurrency = currency),
      this.currencyForm.get('currency').valueChanges.subscribe(currency => this._appService.setCurrency(currency)) // TODO: debug selection of currency
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
