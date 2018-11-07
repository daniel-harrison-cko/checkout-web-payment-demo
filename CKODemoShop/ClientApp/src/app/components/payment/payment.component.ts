import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { IAddress } from '../../interfaces/address.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { IGtcDisclaimer } from '../../interfaces/gtc-disclaimer.interface';
import { PaymentService } from '../../services/payment.service';
import { IIssuer } from '../../interfaces/issuer.interface';
import { IPaymentMethod } from '../../interfaces/payment-method.interface';
import { Subscription } from 'rxjs';
import { IIdealSource } from '../../interfaces/ideal-source.interface';
import { IGiropaySource } from '../../interfaces/giropay-source.interface';

const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card'
  },
  {
    name: 'iDeal',
    lppId: 'lpp_9'
  },
  {
    name: 'giropay',
    lppId: 'lpp_giropay'
  },
  {
    name: 'PayPal',
    lppId: 'lpp_19'
  }
]

@Component({
  selector: 'payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  isLinear = true;
  customerFormGroup: FormGroup;
  addressFormGroup: FormGroup;
  paymentFormGroup: FormGroup;
  selectedPaymentMethod: IPaymentMethod;
  paymentMethods: IPaymentMethod[] = PAYMENT_METHODS;
  gtcDisclaimer: IGtcDisclaimer = {
    i_have_read_and_agree: 'I have read and agree with the',
    g_t_c: 'General Terms & Conditions',
    g_t_c_uri: 'https://www.checkout.com/legal/terms-and-policies',
    i_have_verified_and_want_to_pay: 'My Billing Details are correct and I want to continue with the payment'
  }
  agreesWithGtc: boolean;
  makePayment: Function;
  customer: ICustomer;
  issuers: IIssuer[];

  constructor(private _formBuilder: FormBuilder, private _paymentService: PaymentService) { }

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
      payment_configurators: this._formBuilder.array([]),
      gtc: [false, Validators.required]
    });

    this.subscriptions.push(
      this.paymentFormGroup.get('payment_method').valueChanges.subscribe(payment_method => this.selectedPaymentMethod = payment_method),
      this.paymentFormGroup.get('gtc').valueChanges.subscribe(agreesWithGtc => this.agreesWithGtc = agreesWithGtc)
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get payment_configurators(): FormArray {
    return <FormArray>this.paymentFormGroup.get('payment_configurators');
  }

  private addPaymentConfigurator() {
    this.payment_configurators.push(this._formBuilder.control('', Validators.required));
  }

  private clearPaymentConfigurator = () => {
    let payment_configurators = this.payment_configurators;
    while (payment_configurators.length !== 0) {
      payment_configurators.removeAt(0);
    }
  }

  invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.clearPaymentConfigurator();
    switch (paymentMethod.lppId) {
      case 'lpp_9': {
        this.getIssuers(paymentMethod);
        this.addPaymentConfigurator();
        this.makePayment = () => {
          this._paymentService.requestPayment({
            source: <IIdealSource>{
              type: 'ideal',
              issuer_id: 'INGBNL2A'
            },
            amount: 100,
            currency: 'EUR'
          }).subscribe(response => console.log('iDeal Response:', response))
        };
        break;
      }
      case 'lpp_giropay': {
        this.getIssuers(paymentMethod);
        this.addPaymentConfigurator();
        this.makePayment = () => {
          this._paymentService.requestPayment({
            source: <IGiropaySource>{
              type: 'giropay',
              purpose: 'CKO Demo Shop Test',
              bic: 'TESTDETT421'
            },
            amount: 100,
            currency: 'EUR'
          }).subscribe(response => console.log('giropay Response:', response))
        };
        break;
      }
      default: {
        console.warn('No payment method specific action was defined!');
        this.makePayment = () => { throw new Error(`${paymentMethod.name} payment is not implemented yet!`) };
        break;
      }
    }
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

  getIssuers(paymentMethod: IPaymentMethod) {
    if (paymentMethod.lppId == 'lpp_giropay') {
      paymentMethod.lppId = 'lpp_9';
    }
    this._paymentService.getIssuers(paymentMethod).subscribe(response => this.issuers = response.body);
  }
}
