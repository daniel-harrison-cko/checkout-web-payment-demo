import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl } from '@angular/forms';
import { IAddress } from '../../interfaces/address.interface';
import { IGtcDisclaimer } from '../../interfaces/gtc-disclaimer.interface';
import { PaymentService } from '../../services/payment.service';
import { IBank } from '../../interfaces/bank.interface';
import { IPaymentMethod } from '../../interfaces/payment-method.interface';
import { Subscription, Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { IIdealSource } from '../../interfaces/ideal-source.interface';
import { IGiropaySource } from '../../interfaces/giropay-source.interface';
import { HttpResponse } from '@angular/common/http';
import { IUser } from '../../interfaces/user.interface';
import { ScriptService } from '../../services/script.service';
import { ITokenSource } from 'src/app/interfaces/token-source.interface';
import { Router } from '@angular/router';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { OrderService } from 'src/app/services/order.service';
import { IPending } from 'src/app/interfaces/pending.interface';
import { MatRadioChange } from '@angular/material';

declare var Frames: any;

const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card (Frames)',
    type: 'cko-frames'
  },
  {
    name: 'Credit Card (PCI DSS)',
    type: 'card'
  },
  {
    name: 'iDeal',
    type: 'lpp_9'
  },
  {
    name: 'giropay',
    type: 'giropay'
  }
]

@Component({
  selector: 'app-payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  isLinear = true;
  productFormGroup: FormGroup;
  paymentMethodFormGroup: FormGroup;
  paymentConfigurationFormGroup: FormGroup;
  customerFormGroup: FormGroup;
  addressFormGroup: FormGroup;
  paymentFormGroup: FormGroup;
  cardFormGroup: FormGroup;
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
  framesPayment: boolean;
  cardPayment: boolean;
  makePayment: Function;
  customer: IUser;
  autoCapture: boolean = true;
  threeDs: boolean = false;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedBank: IBank;
  baseUri: string = window.location.origin;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentService: PaymentService,
    private _scriptService: ScriptService,
    private _router: Router,
    private _ngZone: NgZone,
    private _orderService: OrderService
  ) { }

  ngOnInit() {
    this.productFormGroup = this._formBuilder.group({
      amount: ['1', [Validators.required, Validators.min(0)]]
    });
    this.paymentMethodFormGroup = this._formBuilder.group({
      payment_method: ['', Validators.required],
      payment_configurators: this._formBuilder.array([])
    });
    this.paymentConfigurationFormGroup = this._formBuilder.group({
      autoCapture: [true, Validators.required],
      threeDs: [false, Validators.required]
    });
    this.customerFormGroup = this._formBuilder.group({
      name: ['Bruce Wayne', Validators.required],
      email: ['bruce@wayne-enterprises.com', [Validators.required, Validators.email]]
    });
    this.addressFormGroup = this._formBuilder.group({
      address_line1: ['Wayne Plaza 1', Validators.required],
      address_line2: [''],
      city: ['Gotham City', Validators.required],
      state: ['NJ', Validators.required],
      zip: ['12345', Validators.required],
      country: ['USA', Validators.required]
    });
    this.cardFormGroup = this._formBuilder.group({
      number: ['4242424242424242', Validators.required],
      expiration: ['122022', Validators.required],
      cvv: ['100', [Validators.minLength(3), Validators.maxLength(4)]]
    });
    this.paymentFormGroup = this._formBuilder.group({
      gtc: [false, Validators.required]
    });

    this.subscriptions.push(
      this.paymentMethodFormGroup.get('payment_method').valueChanges.subscribe(payment_method => this.selectedPaymentMethod = payment_method),
      this.paymentFormGroup.get('gtc').valueChanges.subscribe(agreesWithGtc => this.agreesWithGtc = agreesWithGtc),
      this.paymentConfigurationFormGroup.get('autoCapture').valueChanges.subscribe(autoCapture => this.autoCapture = autoCapture),
      this.paymentConfigurationFormGroup.get('threeDs').valueChanges.subscribe(threeDs => this.threeDs = threeDs)
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
    return <FormArray>this.paymentMethodFormGroup.get('payment_configurators');
  }

  private addPaymentConfigurator(configurator: any) {
    this.payment_configurators.push(configurator);
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

  paymentMethodSelected(event: MatRadioChange) {
    this.invokePaymentMethod(event.value);
  }

  private invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.resetPaymentConfigurations();
    switch (paymentMethod.type) {
      case 'card': {
        this.framesPayment = null;
        this.cardPayment = true;
        this.addPaymentConfigurator(this.cardFormGroup);
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: 'EUR',
            amount: this.getAmount(),
            source: {
              type: 'card',
              number: this.cardFormGroup.get('number').value,
              expiryMonth: this._paymentService.getMonth(this.cardFormGroup.get('expiration').value),
              expiryYear: this._paymentService.getYear(this.cardFormGroup.get('expiration').value)
            },
            capture: this.autoCapture,
            '3ds': {
              enabled: this.threeDs
            },
            successUrl: `${this.baseUri}/order/succeeded`,
            failureUrl: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response));
        }
        break;
      }
      case 'cko-frames': {
        this.framesPayment = true;
        this.cardPayment = null;
        this._scriptService.load('cko-frames').then(data => {
          let cardTokenisedCallback = (event) => {
            this._paymentService.requestToken({
              type: 'card',
              number: '5436031030606378',
              expiryMonth: 12,
              expiryYear: 2022
            }).subscribe(response => this.handleCardTokenResponse(response));
          };
          Frames.init({
            publicKey: 'pk_test_3f148aa9-347a-450d-b940-0a8645b324e7',
            containerSelector: '.cko-container',
            cardTokenised: function (event) {
              cardTokenisedCallback(event);
            },
            cardTokenisationFailed: function (event) {
              // catch the error
            }
          });
        }).catch(error => console.log(error));
        this.makePayment = () => {
          this.processing = true;
          Frames.submitCard();
        }
        break;
      }
      case 'lpp_9': {
        this.framesPayment = null;
        this.cardPayment = null;
        this.getBanksLegacy(paymentMethod);
        this.addPaymentConfigurator(this._formBuilder.control('', Validators.required));
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: 'EUR',
            amount: this.getAmount(),
            source: <IIdealSource>{
              type: 'ideal',
              issuer_id: this.selectedBank.value,
            },
            successUrl: `${this.baseUri}/order/succeeded`,
            failureUrl: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'giropay': {
        this.framesPayment = null;
        this.cardPayment = null;
        this.getBanks(paymentMethod);
        this.addPaymentConfigurator(this._formBuilder.control('', Validators.required));
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: 'EUR',
            amount: this.getAmount(),
            source: <IGiropaySource>{
              type: 'giropay',
              purpose: 'CKO Demo Shop Test',
              bic: this.selectedBank.value
            },
            successUrl: `${this.baseUri}/order/succeeded`,
            failureUrl: `${this.baseUri}/order/failed`
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

  getAmount(): number {
    return this.productFormGroup.get('amount').value;
  };

  handleCardTokenResponse(response: HttpResponse<any>) {
    switch (response.status) {
      case 201: {
        this._paymentService.requestPayment({
          currency: 'EUR',
          amount: this.getAmount(),
          source: <ITokenSource>{
            type: 'token',
            token: response.body['token']
          },
          capture: this.autoCapture,
          '3ds': {
            enabled: this.threeDs
          },
          successUrl: `${this.baseUri}/order/succeeded`,
          failureUrl: `${this.baseUri}/order/failed`
        }).subscribe(response => this.handlePaymentResponse(response));
        break;
      }
      default: {
        this.paymentMethodFormGroup.reset();
        this.resetPaymentConfigurations();
        throw new Error(`Handling of response status ${response.status} is not implemented!`);
      };
    }
  }

  handlePaymentResponse(response: HttpResponse<any>) {
    try {
      switch (response.status) {
        case 201: {
          this.addPaymentToLocalStorage((<IPayment>response.body).id);
          this._ngZone.run(() => this._router.navigate([`/user/orders/${(<IPayment>response.body).id}`]));
          break;
        }
        case 202: {
          this.addPaymentToLocalStorage((<IPending>response.body).id);
          this._paymentService.redirect(response);
          break;
        }
        default: {
          this.paymentMethodFormGroup.reset();
          this.resetPaymentConfigurations();
          throw new Error(`Handling of response status ${response.status} is not implemented!`);
        }
      }
    } catch (e) {
      console.error(e);
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

  addPaymentToLocalStorage(id: string) {
    let payments: string[] = JSON.parse(localStorage.getItem('payments'));
    if (!payments) {
      localStorage.setItem('payments', JSON.stringify([id]));
    } else {
      payments.push(id);
      localStorage.setItem('payments', JSON.stringify(payments));
    }
  }
}
