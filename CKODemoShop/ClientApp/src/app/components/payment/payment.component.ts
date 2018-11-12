import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { IAddress } from '../../interfaces/address.interface';
import { ICustomer } from '../../interfaces/customer.interface';
import { IGtcDisclaimer } from '../../interfaces/gtc-disclaimer.interface';
import { PaymentService } from '../../services/payment.service';
import { IBank } from '../../interfaces/bank.interface';
import { IPaymentMethod } from '../../interfaces/payment-method.interface';
import { Subscription, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { IIdealSource } from '../../interfaces/ideal-source.interface';
import { IGiropaySource } from '../../interfaces/giropay-source.interface';
import { HttpResponse } from '@angular/common/http';

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
  processing: boolean;
  makePayment: Function;
  customer: ICustomer;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedBank: IBank;

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
      this.paymentFormGroup.get('gtc').valueChanges.subscribe(agreesWithGtc => this.agreesWithGtc = agreesWithGtc),
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private onBankSelectionChanged() {
    let bankInput: FormControl = <FormControl>this.payment_configurators.at(0);
    let currentBank: IBank = bankInput.value;
    this.selectedBank = currentBank;
    bankInput.setValue(`${currentBank.value} ${currentBank.key}`);
  }

  private _bankFilter(value: string): IBank[] {
    const filterValue = value.toString().toLowerCase();
    return this.banks.filter(bank => { return (bank.value.toLowerCase().includes(filterValue) || bank.key.toLowerCase().includes(filterValue)) });
  }

  get payment_configurators(): FormArray {
    return <FormArray>this.paymentFormGroup.get('payment_configurators');
  }

  private addPaymentConfigurator() {
    this.payment_configurators.push(this._formBuilder.control('', Validators.required));    
  }

  private resetPaymentConfigurations = () => {
    this.banks = null;
    this.filteredBanks = null;
    this.selectedBank = null;
    this.processing = null;
    let payment_configurators = this.payment_configurators;
    while (payment_configurators.length !== 0) {
      payment_configurators.removeAt(0);
    }
  }

  invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.resetPaymentConfigurations();
    switch (paymentMethod.lppId) {
      case 'lpp_9': {
        this.getBanksLegacy(paymentMethod);
        this.addPaymentConfigurator();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            source: <IIdealSource>{
              type: 'ideal',
              issuer_id: this.selectedBank.value
            },
            amount: 100,
            currency: 'EUR'
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'lpp_giropay': {
        this.getBanks(paymentMethod);
        this.addPaymentConfigurator();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            source: <IGiropaySource>{
              type: 'giropay',
              purpose: 'CKO Demo Shop Test',
              bic: this.selectedBank.value
            },
            amount: 100,
            currency: 'EUR'
          }).subscribe(response => this.handlePaymentResponse(response))
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

  handlePaymentResponse(response: HttpResponse<any>) {
    switch (response.status) {
      case 201: {
        console.log(`Response status: ${response.status}`);
        break;
      }
      case 202: {
        this._paymentService.redirect(response);
        break;
      }
      default: {
        this.paymentFormGroup.reset();
        this.resetPaymentConfigurations();
        throw new Error(`Handling of response status ${response.status} is not implemented!`);
      }
    }
  }

  getBanksLegacy(paymentMethod: IPaymentMethod) {
    this._paymentService.getLegacyBanks(paymentMethod).subscribe(response => {
      this.banks = response.body
      this.filteredBanks = (<FormControl>this.payment_configurators.at(0)).valueChanges.pipe(
        startWith(''),
        map(value => this._bankFilter(value))
      );
    });
  }

  getBanks(paymentMethod: IPaymentMethod) {
    this._paymentService.getBanks(paymentMethod).subscribe(response => {
      let banks: IBank[] = [];
      Object.keys(response.body.banks).forEach(function (key) {
        banks.push({
          key: response.body.banks[key],
          value: key
        })
      });
      this.banks = banks;
      this.filteredBanks = (<FormControl>this.payment_configurators.at(0)).valueChanges.pipe(
        startWith(''),
        map(value => this._bankFilter(value))
      );
    });    
  }
}
