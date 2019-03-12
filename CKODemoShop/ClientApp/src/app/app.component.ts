import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from './interfaces/currency.interface';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { PaymentsService } from './services/payments.service';
import { distinctUntilChanged } from 'rxjs/operators';
import { Router } from '@angular/router';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  title: string = 'CKO Demo';
  currencies: ICurrency[] = this._paymentsService.currencies;
  private _selectedCurrency: ICurrency;
  currencyForm: FormGroup;

  constructor(
    private _paymentsService: PaymentsService,
    private _formBuilder: FormBuilder,
    private _router: Router
  ) { }

  ngOnInit() {
    this.currencyForm = this._formBuilder.group({
      currency: [null, Validators.required]
    });
    this.subscriptions.push(
      this._paymentsService.currency$.subscribe(currency => this.selectedCurrency = currency),
      this.currencyForm.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(currency => this._paymentsService.setCurrency(currency)) // TODO: debug selection of currency
    );
  }

  get selectedCurrency(): ICurrency {
    return this._selectedCurrency;
  }

  set selectedCurrency(currency: ICurrency) {
    this._selectedCurrency = currency;
    this.currencyForm.get('currency').setValue(currency);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private navigateTo = (url: string) => { this._router.navigateByUrl(url) };
}
