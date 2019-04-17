import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';
import { IPaymentMethod } from 'src/app/interfaces/payment-method.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Observable, Subscription } from 'rxjs';
import { PaymentsService } from 'src/app/services/payments.service';
import { startWith, map, distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
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
    processingCurrencies: ['EUR', 'DKK', 'GBP', 'NOK', 'SEK']
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
  titles = ['Mr', 'Ms'];
  subscriptions: Subscription[] = [];
  paymentMethodSubsriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  customer: FormGroup;
  listenToValueChanges: boolean;
  paymentMethodRequiresAdditionalInformation: boolean;
  selectedSourceType: string;
  creditCardForm: FormGroup;
  klarnaCreditSession: FormGroup;
  klarnaCreditSessionResponse: FormGroup = this._formBuilder.group({});
  sepaSourceDataForm: FormGroup;
  addressForm: FormGroup;
  bankForm: FormGroup;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;

  private paymentMethods = PAYMENT_METHODS;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentsService: PaymentsService,
    private _scriptService: ScriptService,
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
      this._paymentDetailsService.listenToValueChanges$.subscribe(listenToValueChanges => this.listenToValueChanges = listenToValueChanges),
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this._paymentDetailsService.customer$.pipe(distinctUntilChanged()).subscribe(customerFullName => this.customer = customerFullName),
      this.paymentDetails.get('source').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.listenToValueChanges)).subscribe(source => this.routePaymentMethod(source)),
      this.bankForm.get('bankObject.bic').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.listenToValueChanges)).subscribe(bic => this.paymentDetails.get('source.bic').setValue(bic))
    );
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
    return this.paymentDetails.value.source.type ? PAYMENT_METHODS.find(element => element.type == this.paymentDetails.value.source.type).name : '';
  }

  private deselectBank() {
    let bankObject = this.bankForm.get('bankObject');
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
      let bank = <FormControl>this.bankForm.get('bank');
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
      let bank = <FormControl>this.bankForm.get('bank');
      this.filteredBanks = bank.valueChanges.pipe(
        startWith(''),
        map(value => this._bankFilter(value))
      );
    });
  }

  private arrayIsNotEmpty(array: []) {
    return array ? array.length > 0 : false;
  }

  private onBankSelectionChanged() {
    let bankInput: FormControl = <FormControl>this.bankForm.get('bank');
    if (bankInput.value) {
      let currentBank: IBank = bankInput.value;
      let bankObject = this.bankForm.get('bankObject');
      bankObject.setValue(currentBank);
      bankInput.setValue(`${currentBank.bic} ${currentBank.name}`);
    }    
  }

  private resetPaymentMethod = () => {
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

  private routePaymentMethod(paymentMethod: IPaymentMethod) {
    if (paymentMethod.type == this.paymentDetails.value.source.type) return;
    this._paymentDetailsService.stopListeningToValueChanges();
    this.resetPaymentMethod();
    switch (paymentMethod.type) {
      case 'cko-frames': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        break;
      }
      case 'card': {
        this.paymentMethodRequiresAdditionalInformation = true;
        this._paymentDetailsService.requiresConfirmationStep = false;

        this.source.addControl('number', new FormControl('4242424242424242', Validators.required));
        this.source.addControl('expiry_month', new FormControl(12, Validators.compose([Validators.required, Validators.min(1), Validators.max(12)])));
        this.source.addControl('expiry_year', new FormControl(2022, Validators.required));
        this.source.addControl('name', new FormControl(this.paymentDetails.value.customer.name));
        this.source.addControl('cvv', new FormControl('100', Validators.compose([Validators.minLength(3), Validators.maxLength(4)])));
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

        let requestKlarnaCreditSession = () => this._paymentsService.requestKlarnaSession(this.klarnaCreditSession.value).subscribe(klarnaCreditSessionResponse => handleKlarnaCreditSessionResponse(klarnaCreditSessionResponse));
        let handleKlarnaCreditSessionResponse = async (klarnaCreditSessionResponse: HttpResponse<any>) => {
          if (klarnaCreditSessionResponse.ok) {
            this.klarnaCreditSessionResponse.addControl('selected_payment_method_category', new FormControl(null, Validators.required));
            this.klarnaCreditSessionResponse.addControl(
              'credit_session_response',
              this._formBuilder.group({
                session_id: [null, Validators.required],
                client_token: [null, Validators.required],
                payment_method_categories: [null, Validators.required]
              })              
            );
            this.klarnaCreditSessionResponse.get('credit_session_response').patchValue(klarnaCreditSessionResponse.body);
            if (document.querySelector('#klarna-container')) {
              document.querySelector('#klarna-container').innerHTML = '';
            }
            if (this.arrayIsNotEmpty(klarnaCreditSessionResponse.body.payment_method_categories)) {
              this.klarnaCreditSessionResponse.get('selected_payment_method_category').setValue(klarnaCreditSessionResponse.body.payment_method_categories[0].identifier);
              await this._scriptService.load('klarna');
              await klarnaPaymentsInit(klarnaCreditSessionResponse.body.client_token);
              await klarnaPaymentsLoad();
              this.paymentMethodSubsriptions.push(
                this.paymentDetails.get('billing_address').valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(_ => klarnaPaymentsLoad()),
                this.customer.valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(_ => klarnaPaymentsLoad())
              );
            }

            this.paymentMethodSubsriptions.push(
              this.klarnaCreditSessionResponse.get('selected_payment_method_category').valueChanges.pipe(distinctUntilChanged(), debounceTime(500)).subscribe(_ => klarnaPaymentsLoad())
            );
          }
        };
        let klarnaPaymentsInit = async (client_token: string) => new Promise<any>(resolve => {
          this.source.addControl('locale', new FormControl(null, Validators.required));
          this.source.addControl('purchase_country', new FormControl(null, Validators.required));
          this.source.addControl('tax_amount', new FormControl(null, Validators.required));
          this.source.addControl('billing_address', new FormControl(null, Validators.required));
          this.source.addControl('shipping_address', new FormControl(null));
          this.source.addControl('customer', new FormControl(null));
          this.source.addControl('products', new FormControl(null, Validators.required));
          Klarna.Payments.init(
            {
              client_token: client_token
            }
          )
            .then(resolve());
        });
        let klarnaPaymentsLoad = async (data: any = {}) => new Promise<any>(resolve => {
          let paymentDetails = this.paymentDetails;
          let customer = this.customer.value;
          let source = this.source;
          let klarnaCreditSession = this.klarnaCreditSession;
          let billingAddress = paymentDetails.get('billing_address').value;
          let billing_address = {
            given_name: customer.given_name,
            family_name: customer.family_name,
            email: paymentDetails.get('customer.email').value,
            title: customer.title,
            street_address: billingAddress.address_line1,
            street_address2: billingAddress.address_line2,
            postal_code: billingAddress.zip,
            city: billingAddress.city,
            phone: `${customer.phone.country_code}${customer.phone.number}`,
            country: billingAddress.country
          };
          data = {
            purchase_country: klarnaCreditSession.value.purchase_country,
            purchase_currency: paymentDetails.get('currency').value,
            locale: 'en-gb',
            billing_address: billing_address,
            shipping_address: null,
            order_amount: paymentDetails.get('amount').value,
            order_tax_amount: 0,
            order_lines: klarnaCreditSession.value.products,
            customer: null
          }
          Klarna.Payments.load(
            {
              container: '#klarna-container',
              payment_method_categories: [this.klarnaCreditSessionResponse.value.selected_payment_method_category],
              instance_id: 'klarna-payments-instance'
            },
            data,
            function (response) {
              source.patchValue({
                locale: data.locale,
                purchase_country: data.purchase_country,
                tax_amount: data.order_tax_amount,
                billing_address: data.billing_address,
                shipping_address: data.shipping_address,
                customer: data.customer,
                products: data.order_lines
              });
              resolve(response);
            }
          )
        });

        this.klarnaCreditSession = this._formBuilder.group({});
        this.klarnaCreditSession.addControl('purchase_country', new FormControl(this.paymentDetails.value.billing_address.country, Validators.required));
        this.klarnaCreditSession.addControl('currency', new FormControl(this.paymentDetails.value.currency, Validators.required));
        this.klarnaCreditSession.addControl('locale', new FormControl('en-gb', Validators.required));
        this.klarnaCreditSession.addControl('amount', new FormControl(this.paymentDetails.value.amount, Validators.required));
        this.klarnaCreditSession.addControl('tax_amount', new FormControl(0, Validators.required));
        this.klarnaCreditSession.addControl(
          'products',
          this._formBuilder.array([
            this._formBuilder.group({
              name: ['CKO Demo Purchase Item', Validators.required],
              quantity: [1, Validators.required],
              unit_price: [this.paymentDetails.value.amount, Validators.required],
              tax_rate: [0, Validators.required],
              total_amount: [this.paymentDetails.value.amount, Validators.required],
              total_tax_amount: [0, Validators.required],
            })
          ])
        );

        this.paymentMethodSubsriptions.push(
          this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(purchaseCountry => this.klarnaCreditSession.get('purchase_country').setValue(purchaseCountry)),
          this.paymentDetails.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(currency => this.klarnaCreditSession.get('currency').setValue(currency)),
          this.paymentDetails.get('amount').valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(amount => this.klarnaCreditSession.patchValue({ amount: amount, products: [{unit_price: amount, total_amount: amount}]})),
          this.klarnaCreditSession.valueChanges.pipe(distinctUntilChanged(), filter(_ => Klarna)).subscribe(klarnaCreditSession => klarnaPaymentsLoad({
            purchase_country: klarnaCreditSession.purchase_country,
            purchase_currency: klarnaCreditSession.currency,
            locale: 'en-gb',
            order_amount: klarnaCreditSession.amount,
            order_tax_amount: 0,
            order_lines: klarnaCreditSession.products
          }))
        );
        requestKlarnaCreditSession();

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
          this.customer.valueChanges.pipe(distinctUntilChanged()).subscribe(customerFullName => {
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
  }
}
