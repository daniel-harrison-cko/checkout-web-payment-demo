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
import { v4 as uuid } from 'uuid';

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
    type: 'ideal',
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
  paymentMethodSubsriptions: Subscription[] = [];
  @Output() formReady = new EventEmitter<FormGroup>();
  paymentMethods: IPaymentMethod[] = PAYMENT_METHODS;
  paymentMethod: FormGroup;
  paymentDetails: FormGroup;
  customerFullName: FormGroup;
  listenToValueChanges: boolean;
  paymentMethodRequiresAdditionalInformation: boolean;
  selectedSourceType: string;
  klarnaPaymentOptions: IKlarnaPaymentOption[];
  creditCardForm: FormGroup;
  klarnaForm: FormGroup;
  klarnaBillingAddressForm: FormGroup;
  klarnaCustomerForm: FormGroup;
  sepaSourceDataForm: FormGroup;
  addressForm: FormGroup;
  bankForm: FormGroup;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedCurrency: ICurrency = this._paymentsService.currencies[0];
  klarnaProductColumns: string[] = ['name', 'quantity', 'unit_price', 'total_amount'];

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentsService: PaymentsService,
    private _scriptService: ScriptService,
    private _ngZone: NgZone,
    private _paymentDetailsService: PaymentDetailsService
  ) { }

  ngOnInit() {
    this.bankForm = this._formBuilder.group({
      bank: null,
      bankObject: this._formBuilder.group({
        bic: null,
        name: null
      })
    });
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
      this._paymentDetailsService.customerFullName$.pipe(distinctUntilChanged()).subscribe(customerFullName => this.customerFullName = customerFullName),
      this.paymentDetails.get('source').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.listenToValueChanges)).subscribe(source => this.invokePaymentMethod2(source)),
      this.bankForm.get('bankObject.bic').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.listenToValueChanges)).subscribe(bic => this.paymentDetails.get('source.bic').setValue(bic))
    );

    this.formReady.emit(this.paymentMethod);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private matchProcessingCurrencies(processingCurrencies: string[]): boolean {
    return processingCurrencies.length == 0 ? true : processingCurrencies.includes(this.paymentDetails.get('currency').value);
  }

  get source(): FormGroup {
    return <FormGroup>this.paymentDetails.get('source');
  }

  get paymentMethodName(): string {
    return this.selectedSourceType ? this.paymentMethods.find(element => element.type == this.selectedSourceType).name : '';
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
    let bankObject = this.bankObject || this.bankForm.get('bankObject');
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
      let bank = <FormControl>this.bank || <FormControl>this.bankForm.get('bank');
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
      let bank = <FormControl>this.bank || <FormControl>this.bankForm.get('bank');
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
    this.paymentMethodRequiresAdditionalInformation = null;
    this.banks = null;
    this.filteredBanks = null;
    this.paymentMethodSubsriptions.forEach(subscription => subscription.unsubscribe());
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
    let bankInput: FormControl = <FormControl>this.bank || <FormControl>this.bankForm.get('bank');
    if (bankInput.value) {
      let currentBank: IBank = bankInput.value;
      let bankObject = this.bankObject || this.bankForm.get('bankObject');
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
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        this.source.addControl('number', new FormControl('4242424242424242', Validators.required));
        this.source.addControl('expiry_month', new FormControl(12, Validators.required));
        this.source.addControl('expiry_year', new FormControl(2022, Validators.required));
        this.source.addControl('name', new FormControl(this.paymentDetails.value.customer.name));
        this.source.addControl('cvv', new FormControl('100'));
        this.source.addControl('stored', new FormControl(null));
        this.source.addControl('billing_address', new FormControl(this.paymentDetails.value.billing_address));
        this.source.addControl('phone', new FormControl(null));
        break;
      }
      case 'alipay': {
        this.paymentMethodRequiresAdditionalInformation = false;
        this._paymentDetailsService.requiresConfirmationStep = false;

        break;
      }
      case 'bancontact': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        this.source.addControl('payment_country', new FormControl('DE', Validators.required));
        this.source.addControl('account_holder_name', new FormControl(this.paymentDetails.get('customer.name').value, Validators.required));
        this.source.addControl('billing_descriptor', new FormControl('Checkout.com Demo Shop'));

        this.paymentMethodSubsriptions.push(
          this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('account_holder_name').setValue(customerName)),
          this.source.get('account_holder_name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.paymentDetails.get('customer.name').setValue(customerName))
        );
        break;
      }
      case 'boleto': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        this.source.addControl('birthDate', new FormControl('1939-02-19', Validators.required));
        this.source.addControl('cpf', new FormControl('00003456789', Validators.required));
        this.source.addControl('customerName', new FormControl(this.paymentDetails.get('customer.name').value, Validators.required));

        this.paymentMethodSubsriptions.push(
          this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('customerName').setValue(customerName)),
          this.source.get('customerName').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.paymentDetails.get('customer.name').setValue(customerName))
        );
        break;
      }
      case 'giropay': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        this.source.addControl('purpose', new FormControl('Giropay Test Payment', Validators.required));
        this.source.addControl('bic', new FormControl(null));

        this.getBanks(paymentMethod);
        break;
      }
      case 'googlepay': {
        this.paymentMethodRequiresAdditionalInformation = false;
        this._paymentDetailsService.requiresConfirmationStep = false;

        break;
      }
      case 'ideal': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        this.source.addControl('description', new FormControl('iDEAL Test Payment', Validators.required));
        this.source.addControl('bic', new FormControl(null, Validators.required));
        this.source.addControl('language', new FormControl(null));

        this.getBanksLegacy(paymentMethod);
        break;
      }
      case 'klarna': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

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
        this.paymentMethodRequiresAdditionalInformation = false;
        this._paymentDetailsService.requiresConfirmationStep = false;

        break;
      }
      case 'poli': {
        this.paymentMethodRequiresAdditionalInformation = false;
        this._paymentDetailsService.requiresConfirmationStep = false;

        break;
      }
      case 'sepa': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = true;

        this.source.addControl('reference', new FormControl(`cko_demo_${uuid()}`));
        this.source.addControl(
          'billing_address',
          this._formBuilder.group({
            address_line1: null,
            address_line2: null,
            city: null,
            state: null,
            zip: null,
            country: null
          })
        );
        this.source.addControl(
          'phone',
          this._formBuilder.group({
            country_code: null,
            number: null
          })
        );
        this.source.addControl('customer', new FormControl(this.paymentDetails.get('customer').value));
        this.source.addControl(
          'source_data',
          this._formBuilder.group({
            first_name: ['Bruce', Validators.required],
            last_name: ['Wayne', Validators.required],
            account_iban: ['DE25100100101234567893', Validators.required],
            // PBNKDEFFXXX is the required value for bic in Sandbox
            bic: ['PBNKDEFFXXX', Validators.required],
            billing_descriptor: ['CKO Demo Shop', Validators.required],
            mandate_type: ['single', Validators.required]
          })
        );

        this.source.get('billing_address').setValue(this.paymentDetails.get('billing_address').value);

        this.paymentMethodSubsriptions.push(
          this.paymentDetails.get('customer').valueChanges.pipe(distinctUntilChanged()).subscribe(customer => this.source.get('customer').setValue(customer)),
          this.customerFullName.valueChanges.pipe(distinctUntilChanged()).subscribe(customerFullName => {
            this.source.get('source_data.first_name').setValue(customerFullName.given_name);
            this.source.get('source_data.last_name').setValue(customerFullName.family_name);
          }),
          this.paymentDetails.get('billing_address').valueChanges.pipe(distinctUntilChanged()).subscribe(billingAddress => this.source.get('billing_address').setValue(billingAddress))
        );
        break;
      }
      case 'sofort': {
        this.paymentMethodRequiresAdditionalInformation = false;
        this._paymentDetailsService.requiresConfirmationStep = false;

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
      case 'klarna': {
        this.paymentMethod.registerControl('klarnaSession', this.klarnaForm);
        this.paymentMethod.registerControl('klarnaPaymentOption', new FormControl(null, Validators.required));
        this.requestKlarnaSession();
      }
      default: {
        throw new Error(`Handling of Payment Method type ${paymentMethod.type} is not implemented!`);
      }
    }
  }
}
