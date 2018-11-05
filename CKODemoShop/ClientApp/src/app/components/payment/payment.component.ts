import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IAddress } from '../../interfaces/address.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { IGtcDisclaimer } from '../../interfaces/gtc-disclaimer.interface';

@Component({
  selector: 'payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent {
  isLinear = true;
  customerFormGroup: FormGroup;
  addressFormGroup: FormGroup;
  paymentFormGroup: FormGroup;
  selectedPaymentMethod: string;
  paymentMethods: string[] = ['Credit Card', 'iDeal', 'giropay', 'PayPal'];
  gtcDisclaimer: IGtcDisclaimer = {
    i_have_read_and_agree: 'I have read and agree with the',
    g_t_c: 'General Terms & Conditions',
    g_t_c_uri: 'https://www.checkout.com/legal/terms-and-policies',
    i_have_verified_and_want_to_pay: 'My Billing Details are correct and I want to continue with the payment'
  }

  customer: ICustomer;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.customerFormGroup = this._formBuilder.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]]
    });
    this.addressFormGroup = this._formBuilder.group({
      address_line1: ['', Validators.required],
      address_line2: [''],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zip: ['', Validators.required],
      country: ['', Validators.required]
    });
    this.paymentFormGroup = this._formBuilder.group({
      payment_method: ['', Validators.required],
      gtc: [false, Validators.required]
    })
  }

  createCustomer() {
    this.customer = {
      createdOn: Date.now(),
      name: this.customerFormGroup.get('name').value,
      id: '12345',
      email: this.customerFormGroup.get('email').value,
      addresses: [<IAddress>this.addressFormGroup.value],
      billingAddress: <IAddress>this.addressFormGroup.value,
      shippingAddress: <IAddress>this.addressFormGroup.value
    };
  }

  test() {
    console.log(this.customer);
  }
}
