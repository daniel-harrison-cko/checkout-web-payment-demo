import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-payment-configuration-form',
  templateUrl: './payment-configuration-form.component.html'
})
export class PaymentConfigurationFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  threeDs: FormGroup;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentDetailsService: PaymentDetailsService
  ) { }

  ngOnInit() {
    this.threeDs = this._formBuilder.group({
      enabled: false
    });
    this.subscriptions.push(
      this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails)
    );
    this.paymentDetails.addControl('capture', new FormControl(true, Validators.required));
    this.paymentDetails.addControl('3ds', this.threeDs);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
