import { Component, Output, OnInit, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl, FormArray } from '@angular/forms';
import { IPaymentMethod } from 'src/app/interfaces/payment-method.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Observable, Subscription } from 'rxjs';
import { PaymentsService } from 'src/app/services/payments.service';
import { startWith, map, distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { ICurrency } from 'src/app/interfaces/currency.interface';
import { HttpResponse } from '@angular/common/http';
import { IKlarnaPaymentOption } from 'src/app/interfaces/klarna-payment-option.interface';
import { ScriptService } from 'src/app/services/script.service';

declare var Klarna: any;
const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card (Frames)',
    type: 'cko-frames',
    processingCurrencies: ['all']
  },
  {
    name: 'Credit Card (PCI DSS)',
    type: 'card',
    processingCurrencies: ['all']
  },
  {
    name: 'Alipay',
    type: 'alipay',
    processingCurrencies: ['USD']
  },
  {
    name: 'Boleto',
    type: 'boleto',
    processingCurrencies: ['BRL', 'USD']
  },
  {
    name: 'Giropay',
    type: 'giropay',
    processingCurrencies: ['EUR']
  },
  {
    name: 'Google Pay',
    type: 'googlepay',
    processingCurrencies: ['all']
  },
  {
    name: 'iDEAL',
    type: 'lpp_9',
    processingCurrencies: ['EUR']
  },
  {
    name: 'Klarna',
    type: 'klarna',
    processingCurrencies: ['EUR', 'NOK', 'SEK']
  },
  {
    name: 'PayPal',
    type: 'paypal',
    processingCurrencies: ['all']
  },
  {
    name: 'Poli',
    type: 'poli',
    processingCurrencies: ['AUD', 'NZD']
  },
  {
    name: 'SEPA Direct Debit',
    type: 'sepa',
    processingCurrencies: ['EUR']
  },
  {
    name: 'Sofort',
    type: 'sofort',
    processingCurrencies: ['EUR']
  }
]
const flatten = <T = any>(arr: T[]) => {
  const reducer = <T = any>(prev: T[], curr: T | T[]) => {
    if (curr.constructor !== Array) {
      return [...prev, curr];
    }
    return (<T[]>curr).reduce(reducer, prev);
  };
  return arr.reduce(reducer, []);
};

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.component.html'
})

export class PaymentMethodFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  @Output() formReady = new EventEmitter<FormGroup>();
  paymentMethods: IPaymentMethod[] = PAYMENT_METHODS;
  paymentMethod: FormGroup;
  klarnaPaymentOptions: IKlarnaPaymentOption[];
  creditCardForm: FormGroup;
  klarnaForm: FormGroup;
  klarnaBillingAddressForm: FormGroup;
  klarnaCustomerForm: FormGroup;
  mandateForm: FormGroup;
  addressForm: FormGroup;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedCurrency: ICurrency = this._paymentsService.currencies[0];
  klarnaProductColumns: string[] =['name', 'quantity', 'unit_price', 'total_amount'];

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentsService: PaymentsService,
    private _scriptService: ScriptService,
    private _ngZone: NgZone
  ) { }

  ngOnInit() {
    this.paymentMethod = this._formBuilder.group({
      selectedPaymentMethod: [null, Validators.required]
    });
    this.klarnaCustomerForm = this._formBuilder.group({
      date_of_birth: ['1990-01-01']
    });
    this.klarnaBillingAddressForm = this._formBuilder.group({
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
    this.klarnaForm = this._formBuilder.group({
      purchase_country: ['DE', Validators.required],
      currency: [this.selectedCurrency.iso4217, Validators.required],
      locale: ['de-de', Validators.required],
      amount: [null, Validators.required],
      tax_amount: [1, Validators.required],
      products: this._formBuilder.array([
        this._formBuilder.group({
          name: ['Smoke Pellet', Validators.required],
          quantity: [1, Validators.required],
          unit_price: [null, Validators.required],
          tax_rate: [1, Validators.required],
          total_amount: [null, Validators.required],
          total_tax_amount: [1, Validators.required],
        }),
        this._formBuilder.group({
          name: ['Flashbang', Validators.required],
          quantity: [1, Validators.required],
          unit_price: [null, Validators.required],
          tax_rate: [1, Validators.required],
          total_amount: [null, Validators.required],
          total_tax_amount: [1, Validators.required]
        })
      ]),
      billing_address: this.klarnaBillingAddressForm,
      customer: this.klarnaCustomerForm
    });
    this.creditCardForm = this._formBuilder.group({
      number: ['4242424242424242', Validators.required],
      expiration: ['122022', Validators.required],
      cvv: ['100', [Validators.minLength(3), Validators.maxLength(4)]]
    });
    this.mandateForm = this._formBuilder.group({
      account_holder: ['Bruce Wayne', Validators.required],
      first_name: ['Bruce'],
      last_name: ['Wayne'],
      account_iban: ['DE25100100101234567893', Validators.required],
      bic: ['PBNKDEFFXXX'],
      verify_bic: [{ value: 'PBNKDEFFXXX', disabled: true}],
      billing_descriptor: ['CKO Demo Shop', Validators.required],
      mandate_type: ['single', Validators.required]
    });
    this.addressForm = this._formBuilder.group({
      address_line1: ['Wayne Plaza 1', Validators.required],
      address_line2: [''],
      city: ['Gotham City', Validators.required],
      state: ['NJ', Validators.required],
      zip: ['12345', Validators.required],
      country: ['US', Validators.required]
    });
    
    this.subscriptions.push(
      this.paymentMethod.get('selectedPaymentMethod').valueChanges.subscribe(paymentMethod => this.invokePaymentMethod(paymentMethod)),
      this._paymentsService.amount$.subscribe(amount => {
        this.klarnaForm.get('amount').setValue(amount);
        this.klarnaProductsPriceUpdate(amount);
      }),
      this._paymentsService.currency$.subscribe(currency => {
        this.selectedCurrency = currency;
        this.klarnaForm.get('currency').setValue(this.selectedCurrency.iso4217);
      }),
      this.klarnaForm.get('amount').valueChanges.pipe(distinctUntilChanged()).subscribe(amount => this.klarnaProductsPriceUpdate(amount)),
      this.klarnaForm.get('locale').valueChanges.pipe(debounceTime(2000), distinctUntilChanged()).subscribe(_ => {
        this.klarnaPaymentOption.reset();
        document.querySelector('#klarna-container').innerHTML = "";
        this.requestKlarnaSession();
      })
    );

    this.formReady.emit(this.paymentMethod);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private matchProcessingCurrencies(processingCurrencies: string[]): boolean {
    return processingCurrencies.includes('all') ? true : processingCurrencies.includes(this.selectedCurrency.iso4217);
  }

  get selectedPaymentMethod(): IPaymentMethod {
    return this.paymentMethod.get('selectedPaymentMethod').value;
  }

  get bank(): AbstractControl {
    return this.paymentMethod.get('bank');
  }

  get customerName(): AbstractControl {
    return this.paymentMethod.get('customerName');
  }

  get cpf(): AbstractControl {
    return this.paymentMethod.get('cpf');
  }

  get birthDate(): AbstractControl {
    return this.paymentMethod.get('birthDate');
  }

  get bankObject(): AbstractControl {
    return this.paymentMethod.get('bankObject');
  }

  get card(): AbstractControl {
    return this.paymentMethod.get('card');
  }

  get mandate(): AbstractControl {
    return this.paymentMethod.get('mandate');
  }

  get address(): AbstractControl {
    return this.paymentMethod.get('address');
  }

  get klarnaSession(): AbstractControl {
    return this.paymentMethod.get('klarnaSession');
  }

  get klarnaPaymentOption(): AbstractControl {
    return this.paymentMethod.get('klarnaPaymentOption');
  }

  private deselectBank() {
    this.bankObject.reset();
  }

  private _bankFilter(value: string): IBank[] {
    if (!value) {
      return this.banks;
    } else {
      const filterValue = value.toString().toLowerCase();
      return this.banks.filter(bank => { return `${bank.bic.toLowerCase()} ${bank.name.toLowerCase()}`.includes(filterValue) });
    }    
  }

  getBanksLegacy(paymentMethod: IPaymentMethod) {
    this._paymentsService.getLegacyBanks(paymentMethod).subscribe(response => {
      let banks: IBank[] = [];
      response.body.countries.forEach(country => banks.push(country.issuers));
      this.banks = <IBank[]>flatten(banks);
      this.filteredBanks = (<FormControl>this.bank).valueChanges.pipe(
        startWith(''),
        map(value => this._bankFilter(value))
      );
    });
  }

  getBanks(paymentMethod: IPaymentMethod) {
    this._paymentsService.getBanks(paymentMethod).subscribe(response => {
      let banks: IBank[] = [];
      Object.keys(response.body.banks).forEach(function (key) {
        banks.push({
          bic: key,
          name: response.body.banks[key]          
        })
      });
      this.banks = banks;
      this.filteredBanks = (<FormControl>this.bank).valueChanges.pipe(
        startWith(''),
        map(value => this._bankFilter(value))
      );
    });
  }

  handleKlarnaSession(response: HttpResponse<any>) {
    this.klarnaPaymentOptions = response.body.payment_method_categories;
    this._scriptService.load('klarna')
      .then(_ => {
        Klarna.Payments.init({
          client_token: response.body.client_token
        });
      });
  }

  private klarnaProductTotal = (product) => product.total_amount;
  private klarnaProductsTotal = (prev, next) => (prev + next);
  private klarnaProductsPriceUpdate(amount: number) {
    (this.klarnaForm.get('products') as FormArray).controls[0].get('unit_price').setValue(Math.round(amount * 0.25));
    (this.klarnaForm.get('products') as FormArray).controls[0].get('total_amount').setValue(Math.round(amount * 0.25));
    (this.klarnaForm.get('products') as FormArray).controls[1].get('unit_price').setValue(Math.round(amount * 0.75));
    (this.klarnaForm.get('products') as FormArray).controls[1].get('total_amount').setValue(Math.round(amount * 0.75));
  };
  get klarnaGrandTotal() { return (this.klarnaForm.get('products').value as []).map(this.klarnaProductTotal).reduce(this.klarnaProductsTotal) };

  private resetPaymentMethod = () => {
    this.banks = null;
    this.filteredBanks = null;
    if (this.bank) { this.paymentMethod.removeControl('bank') };
    if (this.bankObject) { this.paymentMethod.removeControl('bankObject') };
    if (this.card) { this.paymentMethod.removeControl('card') };
    if (this.mandate) { this.paymentMethod.removeControl('mandate') };
    if (this.address) { this.paymentMethod.removeControl('address') };
    if (this.customerName) { this.paymentMethod.removeControl('customerName') };
    if (this.cpf) { this.paymentMethod.removeControl('cpf') };
    if (this.birthDate) { this.paymentMethod.removeControl('birthDate') };
    if (this.klarnaSession) { this.paymentMethod.removeControl('klarnaSession') };
    if (this.klarnaPaymentOption) { this.paymentMethod.removeControl('klarnaPaymentOption') };
  }

  private onBankSelectionChanged() {
    let bankInput: FormControl = <FormControl>this.bank;
    if (bankInput.value) {
      let currentBank: IBank = bankInput.value;
      this.bankObject.setValue(currentBank);
      bankInput.setValue(`${currentBank.bic} ${currentBank.name}`);
    }    
  }

  private requestKlarnaSession() {
    this._paymentsService.requestKlarnaSession(this.klarnaForm.value).subscribe(response => this.handleKlarnaSession(response));
  }

  private loadKlarnaWidget(paymentMethodCategories: string[], billingAddress: any = this.klarnaBillingAddressForm.value, customer: any = this.klarnaCustomerForm.value) {
    document.querySelector('#klarna-container').innerHTML = "";
    let klarnaLoadCallback = (response) => {
      this._ngZone.run(() => { });
    };
    Klarna.Payments.load({
      container: '#klarna-container',
      payment_method_categories: paymentMethodCategories,
      instance_id: 'cko-demo-klarna-instance'
    }, {
        billing_address: billingAddress,
        customer: customer
    }, function (response) {
        klarnaLoadCallback(response);
    })
  }

  invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.resetPaymentMethod();
    switch (paymentMethod.type) { 
      case 'cko-frames': {
        break;
      }
      case 'card': {
        this.paymentMethod.setControl('card', this.creditCardForm);
        break;
      }
      case 'alipay': {
        break;
      }
      case 'boleto': {
        this.paymentMethod.setControl('customerName', new FormControl('Sarah Mitchell', Validators.required));
        this.paymentMethod.setControl('cpf', new FormControl('00003456789', Validators.required));
        this.paymentMethod.setControl('birthDate', new FormControl('1984-03-04', Validators.required));
        break;
      }
      case 'giropay': {
        this.paymentMethod.setControl('bank', new FormControl(null, Validators.required));
        this.paymentMethod.setControl('bankObject', new FormControl(null, Validators.required));
        this.getBanks(paymentMethod);
        break;
      }
      case 'googlepay': {
        break;
      }
      case 'klarna': {
        this.paymentMethod.setControl('klarnaSession', this.klarnaForm);
        this.paymentMethod.setControl('klarnaPaymentOption', new FormControl(null, Validators.required));
        this.requestKlarnaSession();
      }
      case 'paypal': {
        break;
      }
      case 'poli': {
        break;
      }
      case 'lpp_9': {
        this.paymentMethod.setControl('bank', new FormControl(null, Validators.required));
        this.paymentMethod.setControl('bankObject', new FormControl(null, Validators.required));
        this.getBanksLegacy(paymentMethod);
        break;
      }
      case 'sofort': {
        break;
      }
      case 'sepa': {
        this.paymentMethod.setControl('mandate', this.mandateForm);
        this.paymentMethod.setControl('address', this.addressForm);
        break;
      }
      default: {
        throw new Error(`Handling of Payment Method type ${paymentMethod.type} is not implemented!`);
      }
    }
  }
}
