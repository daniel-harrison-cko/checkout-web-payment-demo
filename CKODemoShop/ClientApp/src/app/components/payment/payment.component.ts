import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IAddress } from '../../interfaces/address.interface';
import { ICustomer } from '../../interfaces/customer.interface';

@Component({
  selector: 'payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent {
  isLinear = true;
  firstFormGroup: FormGroup;
  secondFormGroup: FormGroup;
  thirdFormGroup: FormGroup;
  selectedPaymentMethod: string;
  paymentMethods: string[] = ['Credit Card', 'iDeal', 'giropay', 'PayPal'];
  customer: ICustomer;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.firstFormGroup = this._formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
    this.secondFormGroup = this._formBuilder.group({
      address_line1: ['', Validators.required],
      address_line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required]
    });
    this.thirdFormGroup = this._formBuilder.group({
      payment_method: ['', Validators.required]
    })
  }

  createCustomer() {
    this.customer = {
      createdOn: Date.now(),
      name: this.firstFormGroup.get('name').value,
      id: '12345',
      email: this.firstFormGroup.get('email').value,
      addresses: [<IAddress>this.secondFormGroup.value],
      billingAddress: <IAddress>this.secondFormGroup.value,
      shippingAddress: <IAddress>this.secondFormGroup.value
    };
  }

  test() {
    console.log(this.customer);
  }
}
