import { Component, Output, OnInit, EventEmitter, OnDestroy, NgZone } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl, FormControl, FormArray } from '@angular/forms';
import { IPaymentMethod } from 'src/app/interfaces/payment-method.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Observable, Subscription } from 'rxjs';
import { PaymentsService } from 'src/app/services/payments.service';
import { startWith, map, distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';
import { ICurrency } from 'src/app/interfaces/currency.interface';
import { HttpResponse } from '@angular/common/http';
import { IKlarnaPaymentOption } from 'src/app/interfaces/klarna-payment-option.interface';
import { ScriptService } from 'src/app/services/script.service';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';

declare var Klarna: any;
const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card (Frames)',
    type: 'cko-frames',
    processingCurrencies: []
  },
  {
    name: 'Credit Card (PCI DSS)',
    type: 'card',
    processingCurrencies: []
  },
  {
    name: 'Alipay',
    type: 'alipay',
    processingCurrencies: ['USD']
  },
  {
    name: 'Bancontact',
    type: 'bancontact',
    processingCurrencies: ['EUR']
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
    processingCurrencies: []
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
    processingCurrencies: []
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
  paymentDetails: FormGroup;
  listenToValueChanges: boolean;
  selectedSourceType: string;
  klarnaPaymentOptions: IKlarnaPaymentOption[];
  creditCardForm: FormGroup;
  klarnaForm: FormGroup;
  klarnaBillingAddressForm: FormGroup;
  klarnaCustomerForm: FormGroup;
  sepaSourceDataForm: FormGroup;
  addressForm: FormGroup;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedCurrency: ICurrency = this._paymentsService.currencies[0];
  klarnaProductColumns: string[] =['name', 'quantity', 'unit_price', 'total_amount'];

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentsService: PaymentsService,
    private _scriptService: ScriptService,
    private _ngZone: NgZone,
    private _paymentDetailsService: PaymentDetailsService
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
    this.sepaSourceDataForm = this._formBuilder.group({
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
      }),
      this._paymentDetailsService.listenToValueChanges$.subscribe(listenToValueChanges => this.listenToValueChanges = listenToValueChanges),
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this.paymentDetails.get('source').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.listenToValueChanges)).subscribe(source => this.invokePaymentMethod2(source))
    );

    this.formReady.emit(this.paymentMethod);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private matchProcessingCurrencies(processingCurrencies: string[]): boolean {
    return processingCurrencies.length == 0 ? true : processingCurrencies.includes(this.selectedCurrency.iso4217);
  }

  get source(): FormGroup {
    return <FormGroup>this.paymentDetails.get('source');
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

  get paymentCountry(): AbstractControl {
    return this.paymentMethod.get('paymentCountry');
  }

  get accountHolderName(): AbstractControl {
    return this.paymentMethod.get('accountHolderName');
  }

  get billingDescriptor(): AbstractControl {
    return this.paymentMethod.get('billingDescriptor');
  }

  private deselectBank() {
    let bankObject = this.bankObject || this.paymentDetails.get('source.bankObject');
    bankObject.reset();
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
      let bank = <FormControl>this.bank || <FormControl>this.paymentDetails.get('source.bank');
      this.filteredBanks = bank.valueChanges.pipe(
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
      let bank = <FormControl>this.bank || <FormControl>this.paymentDetails.get('source.bank');
      this.filteredBanks = bank.valueChanges.pipe(
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

  private resetPaymentMethod2 = () => {
    this.banks = null;
    this.filteredBanks = null;
    Object.keys(this.source.controls).forEach(key => {
      if (key != 'type') {
        this.source.removeControl(key);
      }
    });
  }

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
    if (this.paymentCountry) { this.paymentMethod.removeControl('paymentCountry') };
    if (this.accountHolderName) { this.paymentMethod.removeControl('accountHolderName') };
    if (this.billingDescriptor) { this.paymentMethod.removeControl('billingDescriptor') };
  }

  private onBankSelectionChanged() {
    let bankInput: FormControl = <FormControl>this.bank || <FormControl>this.paymentDetails.get('source.bank');
    if (bankInput.value) {
      let currentBank: IBank = bankInput.value;
      let bankObject = this.bankObject || this.paymentDetails.get('source.bankObject');
      bankObject.setValue(currentBank);
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

  invokePaymentMethod2(paymentMethod: IPaymentMethod) {
    if (paymentMethod.type == this.selectedSourceType) return;
    this._paymentDetailsService.stopListeningToValueChanges();
    this.resetPaymentMethod2();
    switch (paymentMethod.type) {
      case 'card': {
        this.source.addControl('number', new FormControl('4242424242424242', Validators.required));
        this.source.addControl('expiry_month', new FormControl(12, Validators.required));
        this.source.addControl('expiry_year', new FormControl(2022, Validators.required));
        this.source.addControl('name', new FormControl({ value: this.paymentDetails.value.customer.name, disabled: true }));
        this.source.addControl('cvv', new FormControl('100'));
        this.source.addControl('stored', new FormControl(null));
        this.source.addControl('billing_address', new FormControl({ value: this.paymentDetails.value.billing_address, disabled: true }));
        this.source.addControl('phone', new FormControl(null));
        break;
      }
      case 'alipay': {
        break;
      }
      case 'bancontact': {
        this.source.addControl('payment_country', new FormControl({ value: 'DE', disabled: true }, Validators.required));
        this.source.addControl('account_holder_name', new FormControl({ value: this.paymentDetails.value.customer.name, disabled: true }, Validators.required));
        this.source.addControl('billing_descriptor', new FormControl('Bancontact Test Payment'));
        break;
      }
      case 'boleto': {
        this.source.addControl('birthDate', new FormControl('1984-03-04', Validators.required));
        this.source.addControl('cpf', new FormControl('00003456789', Validators.required));
        this.source.addControl('customerName', new FormControl({ value: this.paymentDetails.value.customer.name, disabled: true }, Validators.required));
        break;
      }
      case 'giropay': {
        this.source.addControl('purpose', new FormControl('Giropay Test Payment', Validators.required));
        this.source.addControl('bic', new FormControl(null, Validators.required));
        this.source.addControl('iban', new FormControl(null));

        this.source.addControl('bank', new FormControl(null, Validators.required));
        this.source.addControl('bankObject', new FormControl(null, Validators.required));
        this.getBanks(paymentMethod);
        break;
      }
      case 'googlepay': {
        break;
      }
      case /*'ideal'*/'lpp_9': {
        this.source.addControl('description', new FormControl(null, Validators.required));
        this.source.addControl('bic', new FormControl(null, Validators.required));
        this.source.addControl('language', new FormControl(null));

        this.source.addControl('bank', new FormControl(null, Validators.required));
        this.source.addControl('bankObject', new FormControl(null, Validators.required));
        this.getBanksLegacy(paymentMethod);
        break;
      }
      case 'klarna': {
        this.source.addControl('authorization_token', new FormControl(null, Validators.required));
        this.source.addControl('locale', new FormControl(null, Validators.required));
        this.source.addControl('purchase_country', new FormControl(null, Validators.required));
        // this.source.addControl('auto_capture', new FormControl(null, Validators.required));
        this.source.addControl('billing_address', new FormControl(null, Validators.required));
        this.source.addControl('shipping_address', new FormControl(null));
        this.source.addControl('tax_amount', new FormControl(null, Validators.required));
        this.source.addControl('products', new FormControl(null, Validators.required));
        this.source.addControl('customer', new FormControl(null));
        this.source.addControl('merchant_reference1', new FormControl(null));
        this.source.addControl('merchant_reference2', new FormControl(null));
        this.source.addControl('merchant_data', new FormControl(null));
        this.source.addControl('attachment', new FormControl(null));
        break;
      }
      case 'paypal': {
        break;
      }
      case 'poli': {
        break;
      }
      case 'sepa': {
        this.source.addControl('reference', new FormControl(null));
        this.source.addControl('billing_address', new FormControl(null, Validators.required));
        this.source.addControl('phone', new FormControl(null));
        this.source.addControl('customer', new FormControl(null));
        this.source.addControl('source_data', this.sepaSourceDataForm);
        break;
      }
      case 'sofort': {
        break;
      }
      default: {
        throw new Error(`Handling of Payment Method type ${paymentMethod.type} is not implemented!`);
      }
    }
    this._paymentDetailsService.resumeListeningToValueChanges();
    this.selectedSourceType = paymentMethod.type;
  }

  invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.resetPaymentMethod();
    switch (paymentMethod.type) { 
      case 'cko-frames': {
        break;
      }
      case 'card': {
        this.paymentMethod.registerControl('card', this.creditCardForm);
        break;
      }
      case 'alipay': {
        break;
      }
      case 'bancontact': {
        this.paymentMethod.registerControl('paymentCountry', new FormControl('DE', Validators.required));
        this.paymentMethod.registerControl('accountHolderName', new FormControl('Bruce Wayne', Validators.required));
        this.paymentMethod.registerControl('billingDescriptor', new FormControl(null));
        break;
      }
      case 'boleto': {
        this.paymentMethod.registerControl('customerName', new FormControl('Sarah Mitchell', Validators.required));
        this.paymentMethod.registerControl('cpf', new FormControl('00003456789', Validators.required));
        this.paymentMethod.registerControl('birthDate', new FormControl('1984-03-04', Validators.required));
        break;
      }
      case 'giropay': {
        this.paymentMethod.registerControl('bank', new FormControl(null, Validators.required));
        this.paymentMethod.registerControl('bankObject', new FormControl(null, Validators.required));
        this.getBanks(paymentMethod);
        break;
      }
      case 'googlepay': {
        break;
      }
      case 'klarna': {
        this.paymentMethod.registerControl('klarnaSession', this.klarnaForm);
        this.paymentMethod.registerControl('klarnaPaymentOption', new FormControl(null, Validators.required));
        this.requestKlarnaSession();
      }
      case 'paypal': {
        break;
      }
      case 'poli': {
        break;
      }
      case 'lpp_9': {
        this.paymentMethod.registerControl('bank', new FormControl(null, Validators.required));
        this.paymentMethod.registerControl('bankObject', new FormControl(null, Validators.required));
        this.getBanksLegacy(paymentMethod);
        break;
      }
      case 'sepa': {
        this.paymentMethod.registerControl('mandate', this.sepaSourceDataForm);
        this.paymentMethod.registerControl('address', this.addressForm);
        break;
      }
      case 'sofort': {
        break;
      }
      default: {
        throw new Error(`Handling of Payment Method type ${paymentMethod.type} is not implemented!`);
      }
    }
  }
}
