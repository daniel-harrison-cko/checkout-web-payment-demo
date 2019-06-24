import { Component, OnInit, OnDestroy } from '@angular/core';
import { ICurrency } from './interfaces/currency.interface';
import { FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { PaymentDetailsService } from './services/payment-details.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.sass']
})
export class AppComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  title: string = 'CKO Demo';
  currencies: ICurrency[] = this._paymentDetailsService.currencies;
  paymentDetails: FormGroup;

  constructor(
    private _paymentDetailsService: PaymentDetailsService,
    private _router: Router
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  navigateTo = (url: string) => { this._router.navigateByUrl(url) };
}
