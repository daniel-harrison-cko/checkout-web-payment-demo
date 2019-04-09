import { Component, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-details-form',
  templateUrl: './customer-details-form.component.html'
})

export class CustomerDetailsFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  @Output() formReady = new EventEmitter<FormGroup>();
  customerDetailsForm: FormGroup;
  BillingAddressForm: FormGroup;
  ShippingAddressForm: FormGroup;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.BillingAddressForm = this._formBuilder.group({
      given_name: ['Philippe', Validators.required],
      family_name: ['Leonhardt', Validators.required],
      email: ['philippe.leonhardt@checkout.com', Validators.required],
      title: ['Mr'],
      street_address: ['Rudi-Dutschke-Str. 26', Validators.required],
      street_address2: [''],
      postal_code: ['10969', Validators.required],
      city: ['Berlin', Validators.required],
      country: ['DE', Validators.required]
    });
    this.ShippingAddressForm = this._formBuilder.group({
      given_name: ['Philippe'],
      family_name: ['Leonhardt'],
      email: ['philippe.leonhardt@checkout.com'],
      title: ['Mr'],
      street_address: ['Rudi-Dutschke-Str. 26'],
      street_address2: [''],
      postal_code: ['10969'],
      city: ['Berlin'],
      phone: ['0123456789'],
      country: ['DE']
    });
    this.customerDetailsForm = this._formBuilder.group({
      billingAddress: this.BillingAddressForm,
      shippingAddress: this.ShippingAddressForm
    });
    
    this.subscriptions.push();

    this.formReady.emit(this.customerDetailsForm);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
