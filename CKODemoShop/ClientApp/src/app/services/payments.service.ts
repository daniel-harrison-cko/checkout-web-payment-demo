import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IPayment } from '../interfaces/payment.interface';
import { ICurrency } from '../interfaces/currency.interface';
import { ILink } from '../interfaces/link.interface';
import { HypermediaRequest } from '../components/hypermedia/hypermedia-request';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators, FormArray, FormBuilder } from '@angular/forms';
import { PaymentDetailsService } from './payment-details.service';
import { distinctUntilChanged, finalize, filter, debounceTime } from 'rxjs/operators';
import { ScriptService } from './script.service';
import { AppConfigService } from './app-config.service';
import { ShopService } from './shop.service';
import { BanksService } from './banks.service';
import { MatDialog } from '@angular/material';
import { PaymentErrorAlertComponent } from '../components/payment-error-alert/payment-error-alert.component';

declare var Frames: any;
declare var google: any;
var googleClient: any;
declare var Klarna: any;

const CURRENCIES: ICurrency[] = [
  { iso4217: 'AUD', base: 100 },
  { iso4217: 'BHD', base: 1000 },
  { iso4217: 'BRL', base: 100 },
  { iso4217: 'CHF', base: 100 },
  { iso4217: 'CNY', base: 100 },
  { iso4217: 'EGP', base: 100 },
  { iso4217: 'EUR', base: 100 },
  { iso4217: 'GBP', base: 100 },
  { iso4217: 'HKD', base: 100 },
  { iso4217: 'KWD', base: 1000 },
  { iso4217: 'MXN', base: 100 },
  { iso4217: 'NOK', base: 100 },
  { iso4217: 'NZD', base: 100 },
  { iso4217: 'PLN', base: 100 },
  { iso4217: 'QAR', base: 100 },
  { iso4217: 'SEK', base: 100 },
  { iso4217: 'SGD', base: 100 },
  { iso4217: 'USD', base: 100 }
];
const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card (Frames)',
    type: 'cko-frames',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'Credit Card (PCI DSS)',
    type: 'card',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'ACH',
    type: 'ach',
    restrictedCurrencyCountryPairings: {
      'USD': ['US']
    }
  },
  {
    name: 'Alipay',
    type: 'alipay',
    restrictedCurrencyCountryPairings: {
      'USD': ['CN']
    }
  },
  {
    name: 'Bancontact',
    type: 'bancontact',
    restrictedCurrencyCountryPairings: {
      'EUR': ['BE']
    }
  },
  {
    name: 'BenefitPay',
    type: 'benefitpay',
    restrictedCurrencyCountryPairings: {
      'BHD': ['BH']
    }
  },
  {
    name: 'Boleto Bancário',
    type: 'boleto',
    restrictedCurrencyCountryPairings: {
      'BRL': ['BR'],
      'USD': ['BR']
    }
  },
  {
    name: 'eps',
    type: 'eps',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AT']
    }
  },
  {
    name: 'Fawry',
    type: 'fawry',
    restrictedCurrencyCountryPairings: {
      'EGP': ['EG']
    }
  },
  {
    name: 'giropay',
    type: 'giropay',
    restrictedCurrencyCountryPairings: {
      'EUR': ['DE']
    }
  },
  {
    name: 'Google Pay',
    type: 'googlepay',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'iDEAL',
    type: 'ideal',
    restrictedCurrencyCountryPairings: {
      'EUR': ['NL']
    }
  },
  {
    name: 'Klarna',
    type: 'klarna',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AT', 'DE', 'FI', 'NL'],
      'DKK': ['DK'],
      'GBP': ['GB'],
      'NOK': ['NO'],
      'SEK': ['SE']
    }
  },
  {
    name: 'KNet',
    type: 'knet',
    restrictedCurrencyCountryPairings: {
      'KWD': ['KW']
    }
  },
  {
    name: 'Multibanco',
    type: 'multibanco',
    restrictedCurrencyCountryPairings: {
      'EUR': ['PT']
    }
  },
  {
    name: 'OXXO',
    type: 'oxxo',
    restrictedCurrencyCountryPairings: {
      'MXN': ['MX']
    }
  },
  {
    name: 'PayPal',
    type: 'paypal',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'POLi',
    type: 'poli',
    restrictedCurrencyCountryPairings: {
      'AUD': ['AU'],
      'NZD': ['NZ']
    }
  },
  {
    name: 'Przelewy24',
    type: 'p24',
    restrictedCurrencyCountryPairings: {
      'EUR': ['PL'],
      'PLN': ['PL']
    }
  },
  {
    name: 'QPay',
    type: 'qpay',
    restrictedCurrencyCountryPairings: {
      'QAR': ['QA']
    }
  },
  {
    name: 'SEPA Direct Debit',
    type: 'sepa',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA']
    }
  },
  {
    name: 'Sofort / Pay Now',
    type: 'sofort',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AT', 'BE', 'DE', 'ES', 'IT', 'NL']
    }
  },
  {
    name: 'WeChat Pay',
    type: 'wechat',
    restrictedCurrencyCountryPairings: {
      'CNY': ['CN'],
      'HKD': ['HK'],
      'SGD': ['SG']
    }
  }
]

@Injectable({
  providedIn: 'root'
})

export class PaymentsService {
  private subscriptions: Subscription[] = [];
  private paymentDetails: FormGroup;
  private paymentConsent: FormGroup;
  private customer: FormGroup;
  private paymentRequest: any;
  private _makePayment: Function;
  private _processing: boolean;
  private updateSourceType: boolean = true;
  public klarnaCreditSession: FormGroup;
  public klarnaCreditSessionResponse: FormGroup = this._formBuilder.group({});

  constructor(
    public dialog: MatDialog,
    private _appConfigService: AppConfigService,
    private _http: HttpClient,
    private _banksService: BanksService,
    private _paymentDetailsService: PaymentDetailsService,
    private _shopService: ShopService,
    private _scriptService: ScriptService,
    private _formBuilder: FormBuilder,
    private _router: Router,
    private _ngZone: NgZone
  ) {
    this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails);
    this._paymentDetailsService.paymentConsent$.pipe(distinctUntilChanged()).subscribe(paymentConsent => this.paymentConsent = paymentConsent);
    this._paymentDetailsService.customer$.pipe(distinctUntilChanged()).subscribe(customer => this.customer = customer);
    this.processing$.pipe(distinctUntilChanged()).subscribe(processing => this._processing = processing);
    this.paymentDetails.get('source.type').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.updateSourceType)).subscribe(sourceType => this.setupPaymentMethod(sourceType));
    this.paymentDetails.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(currency => this.updateAvailablePaymentMethods({currency: currency, country: null}));
    this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(country => this.updateAvailablePaymentMethods({currency: null, country: country}));
    this.paymentDetails.valueChanges.pipe(distinctUntilChanged()).subscribe(() => this.paymentRequest = this.paymentDetails.getRawValue());
    this.updateAvailablePaymentMethods({ country: this.paymentDetails.value.billing_address.country, currency: this.paymentDetails.value.currency });
  }

  // Subjects
  private processingSource = new BehaviorSubject<boolean>(false);
  private availablePaymentMethodsSource = new BehaviorSubject<IPaymentMethod[]>(null);

  // Observables
  public processing$ = this.processingSource.asObservable();
  public availablePaymentMethods$ = this.availablePaymentMethodsSource.asObservable();

  // Subjects Methods
  public setProcessing(isProcessing: boolean) {
    this.processingSource.next(isProcessing);
  }

  private updateAvailablePaymentMethods(data: { country: string, currency: string }) {
    let country = data.country || (this.paymentDetails.value.billing_address.country as string);
    let currency = data.currency || (this.paymentDetails.value.currency as string);
    let availablePaymentMethods: IPaymentMethod[] = PAYMENT_METHODS.filter(paymentMethod => {
      if (paymentMethod.restrictedCurrencyCountryPairings == null) return true;
      if (paymentMethod.restrictedCurrencyCountryPairings[currency] != null) {
        if ((paymentMethod.restrictedCurrencyCountryPairings[currency] as string[]).includes(country)) return true;
      }
      return false;
    });
    this.availablePaymentMethodsSource.next(availablePaymentMethods);

    if (!availablePaymentMethods.map(availablePaymentMethod => availablePaymentMethod.type).includes(this.paymentDetails.value.source.type)) {
      this.paymentDetails.get('source.type').reset();
    };
  }

  // Payment Flow Methods
  public makePayment(): void {
    this.setProcessing(true);
    this._makePayment();
  }

  private addPaymentToLocalStorage(id: string) {
    let payments: string[] = JSON.parse(localStorage.getItem('payments'));
    if (!payments) {
      localStorage.setItem('payments', JSON.stringify([id]));
    } else {
      payments.push(id);
      localStorage.setItem('payments', JSON.stringify(payments));
    }
  }

  private paymentRoute(payment: IPayment) {
    this.addPaymentToLocalStorage(payment.id);
    this._ngZone.run(() => this._router.navigate([`/user/orders/${payment.id}`]));
  }

  private paymentRedirect(payment: IPayment) {
    if (payment._links.redirect) {
      this.addPaymentToLocalStorage(payment.id);
      this.redirect(payment._links.redirect);
    } else {
      this.paymentRoute(payment);
    }    
  }

  public handleSourceResponse(response: HttpResponse<any>) {
    let source: any;
    try {
      if (response.body.id) {
        source = {
          type: 'id',
          id: response.body.id
        }
      } else if (response.body.token) {
        source = {
          type: 'token',
          token: response.body.token
        }
      }
      else {
        throw new Error('Unkown Source Type');
      }
    }
    catch (e) {
      console.error(e);
    }
    try {
      switch (response.status) {
        case 201: {
          this.requestPayment({
            currency: this.paymentDetails.value.currency,
            amount: this.paymentDetails.value.amount,
            source: source
          })
            .subscribe(
            response => this.handlePaymentResponse(response),
            error => {
              console.warn(error);
              this.resetPayment();
            });
          break;
        }
        default: {
          this.resetPayment();
          throw new Error(`Handling of response status ${response.status} is not implemented!`);
        }
      }
    }
    catch (e) {
      console.error(e);
    }
  }

  public handlePaymentResponse(response: HttpResponse<any>) {
    this.resetPayment();
    try {
      switch (response.status) {
        case 201: {
          if (response.body._links.redirect) {
            this.paymentRedirect(response.body);
          } else {
            this.paymentRoute(response.body);
          }
          break;
        }
        case 202: {
          this.paymentRedirect(response.body);
          break;
        }
        default: {
          throw new Error(`Handling of response status ${response.status} is not implemented!`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  private setupPaymentAction(makePaymentAction: Function, autoCapture?: boolean, threeDs?: boolean, paymentConfirmationRequired?: boolean) {
    this._makePayment = makePaymentAction;
    this.autoCapture = autoCapture;
    this.threeDs = threeDs;
  }

  private standardPaymentFlow = () => {
    this.requestPayment(this.paymentRequest)
      .pipe(finalize(() => this.resetReference()))
      .subscribe(
        response => this.handlePaymentResponse(response),
          error => {
              // error.error strangely returns a string that represents malformed JSON; this fixes it.
              let errorString = (error.error as string).slice(0, (error.error as string).indexOf(',"target_site"')) + '}';
              this.dialog.open(
                  PaymentErrorAlertComponent,
                  {
                      width: '80%',
                      maxWidth: '500px',
                      data: { paymentErrorResponse: JSON.parse(errorString), status: error.status, statusText: error.statusText }
                  }
              )
              this.resetPayment();
          }
      );
  };

  private sourcesPaymentFlow = () => {
    this.requestSource(this.paymentRequest.source).subscribe(
      response => this.handleSourceResponse(response),
      error => {
        console.warn(error);
        this.resetPayment();
      });
  };

  private googlePayPaymentFlow = () => {
    let processPayment = (paymentData) => {
      this.requestToken({
        wallet_type: this.paymentDetails.value.source.type,
        token_data: JSON.parse(paymentData.paymentMethodToken.token)
      }).subscribe(
        response => this.handleSourceResponse(response),
        error => {
          console.warn(error);
          this.resetPayment();
        });
    };
    let paymentDataRequest = {
      merchantId: '01234567890123456789',
      paymentMethodTokenizationParameters: {
        tokenizationType: 'PAYMENT_GATEWAY',
        parameters: {
          'gateway': 'checkoutltd',
          'gatewayMerchantId': this._appConfigService.config.publicKey
        }
      },
      allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD'],
      cardRequirements: {
        allowedCardNetworks: ['MASTERCARD', 'VISA']
      },
      transactionInfo: {
        currencyCode: this.paymentDetails.value.currency,
        totalPriceStatus: 'FINAL',
        totalPrice: this.paymentDetails.value.amount
      }
    };

    googleClient.loadPaymentData(paymentDataRequest)
      .then(paymentData => processPayment(paymentData))
      .catch(error => {
        console.error(error);
        this.resetPayment();
      });
  };
  
  private klarnaPaymentFlow = async () => {
    let klarnaPaymentsAuthorize = async (data: any = {}) => new Promise<any>(resolve => {
      Klarna.Payments.authorize(
        {
          instance_id: 'klarna-payments-instance',
          auto_finalize: true
        },
        data,
        function (response) {
          resolve(response);
        }
      )
    });
    let klarnaPaymentsAuthorizeResponse = await klarnaPaymentsAuthorize();
    if (klarnaPaymentsAuthorizeResponse.approved) {
      (this.paymentDetails.get('source') as FormGroup).addControl('authorization_token', new FormControl(klarnaPaymentsAuthorizeResponse.authorization_token, Validators.required));
      this.standardPaymentFlow();
    }
  };

  private setupPaymentMethod = async (sourceType: string) => {
    if (this.paymentDetails.value.source.type == sourceType) return;
    this.updateSourceType = false;
    this.resetPayment(false);
    try {
      switch (sourceType) {
        case 'cko-frames': {
          this.paymentDetails.get('capture').setValue(true);
          this.setupPaymentAction(() => { Frames.submitCard(); }, true, true);

          let initializeCkoFrames = async () => {
            let loadedScripts = await this._scriptService.load('cko-frames');
            if (loadedScripts.every(script => script.loaded)) {
              let cardTokenisedCallback = (event) => {
                this.paymentRequest.source.type = 'token';
                this.paymentRequest.source.token = event.data.cardToken;
                this.standardPaymentFlow();
              };
              Frames.init({
                publicKey: this._appConfigService.config.publicKey,
                containerSelector: '.cko-container',
                cardTokenised: function (event) {
                  cardTokenisedCallback(event);
                },
                cardTokenisationFailed: function (event) {
                  // catch the error
                }
              });
            }
          }

          initializeCkoFrames();

          this.source.addControl('token', new FormControl({ value: null, disabled: false }));

          break;
        }
        case 'card': {
          let setCardProcessing = (country: string) => {
            Object.keys(this.processing.controls).forEach(key => {
              if (key != 'mid') {
                this.processing.removeControl(key);
              } else {
                this.processing.get(key).reset();
              }
            });
            switch (country) {
              case 'BR': {
                this.processing.addControl('dlocal', new FormGroup({
                  country: new FormControl({ value: country, disabled: true }, Validators.required),
                  payer: new FormGroup({
                    document: new FormControl({ value: '000.000.000-00', disabled: false }, Validators.required),
                    name: new FormControl({ value: this.paymentDetails.value.customer.name, disabled: false }, Validators.required),
                    email: new FormControl({ value: this.paymentDetails.value.customer.email, disabled: false }, Validators.required)
                  })
                }));
                break;
              };
              default: {
                break;
              }
            }
            console.log(this.processing.value);
          }

          this.paymentDetails.get('capture').setValue(true);
          this.setupPaymentAction(this.standardPaymentFlow, true, true);

          this.source.addControl('number', new FormControl({ value: '4242424242424242', disabled: false }, Validators.required));
          this.source.addControl('expiry_month', new FormControl({ value: 12, disabled: false }, Validators.compose([Validators.required, Validators.min(1), Validators.max(12)])));
          this.source.addControl('expiry_year', new FormControl({ value: 2022, disabled: false }, Validators.required));
          this.source.addControl('name', new FormControl({ value: this.paymentDetails.value.customer.name, disabled: true }));
          this.source.addControl('cvv', new FormControl({ value: '100', disabled: false }, Validators.compose([Validators.minLength(3), Validators.maxLength(4)])));
          this.source.addControl('billing_address', new FormControl({ value: this.paymentDetails.value.billing_address, disabled: true }));

          setCardProcessing(this.paymentDetails.value.billing_address.country);

          this.subscriptions.push(
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(country => setCardProcessing(country)),
            this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('name').setValue(customerName))
          );

          break;
        }
        case 'ach': {
          this.setupPaymentAction(this.sourcesPaymentFlow, false, false);

          this.paymentConsent.enable();
          this.paymentDetails.get('amount').setValue(154);

          this.source.addControl('reference', new FormControl(this.paymentDetails.value.reference));
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
          this.source.addControl('customer', new FormControl(this.paymentDetails.value.customer));
          this.source.addControl(
            'source_data',
            this._formBuilder.group({
              account_holder_name: [{ value: this.paymentDetails.value.customer.name, disabled: true }, Validators.required],
              account_type: [{ value: 'Checking', disabled: false }, Validators.required],
              company_name: [{ value: null, disabled: true }, Validators.required],
              account_number: [{ value: '0123456789', disabled: false }, Validators.required],
              // 211370545 is the required value for routing_number in Sandbox
              routing_number: [{ value: '211370545', disabled: false }, Validators.required],
              billing_descriptor: [{ value: 'ACH Demo', disabled: false }, Validators.compose([Validators.required, Validators.maxLength(15)])]
            })
          );

          this.source.get('billing_address').setValue(this.paymentDetails.get('billing_address').value);

          this.subscriptions.push(
            this.paymentDetails.get('customer').valueChanges.pipe(distinctUntilChanged()).subscribe(customer => {
              this.source.get('customer').patchValue(customer);
              this.source.get('source_data.account_holder_name').setValue(customer.name);
            }),
            this.paymentDetails.get('billing_address').valueChanges.pipe(distinctUntilChanged()).subscribe(billingAddress => this.source.get('billing_address').patchValue(billingAddress)),
            this.paymentDetails.get('source.source_data.account_type').valueChanges.pipe(distinctUntilChanged()).subscribe(account_type => {
              let companyNameController = this.source.get('source_data.company_name');
              if ((account_type as string).toLowerCase().startsWith('corp')) {
                companyNameController.enable();
                companyNameController.markAsTouched();
              } else {
                companyNameController.reset();
                companyNameController.markAsUntouched();
                companyNameController.disable();
              }
              companyNameController.updateValueAndValidity();
            })
          );

          break;
        }
        case 'alipay': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'bancontact': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('account_holder_name', new FormControl({ value: this.paymentDetails.get('customer.name').value, disabled: true }, Validators.required));
          this.source.addControl('payment_country', new FormControl({ value: this.paymentDetails.get('billing_address.country').value, disabled: true }, Validators.required));
          this.source.addControl('billing_descriptor', new FormControl({ value: 'Bancontact Demo Payment', disabled: false }));

          this.subscriptions.push(
            this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('account_holder_name').setValue(customerName)),
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(country => this.source.get('payment_country').setValue(country))
          );

          break;
        }
        case 'benefitpay': {
            this.setupPaymentAction(this.standardPaymentFlow);

            this.source.addControl('integration_type', new FormControl({ value: 'web', disabled: true }, Validators.required));

            break;
        }
        case 'boleto': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('birthDate', new FormControl({ value: '1939-02-19', disabled: false }, Validators.required));
          this.source.addControl('cpf', new FormControl({ value: '00003456789', disabled: false }, Validators.required));
          this.source.addControl('customerName', new FormControl({ value: this.paymentDetails.get('customer.name').value, disabled: true }, Validators.required));

          this.subscriptions.push(
            this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('customerName').setValue(customerName))
          );

          break;
        }
        case 'eps': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('purpose', new FormControl({ value: 'EPS Demo Payment', disabled: false }, Validators.required));
          this.source.addControl('bic', new FormControl({ value: null, disabled: false }));

          await this._banksService.getBanks(sourceType);

          break;
        }
        case 'fawry': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('description', new FormControl({ value: 'Fawry Demo Payment', disabled: false }, Validators.required));
          this.source.addControl('customer_mobile', new FormControl({ value: '0102800991193847299', disabled: false }, Validators.required));
          this.source.addControl('customer_email', new FormControl({ value: this.paymentDetails.value.customer.email, disabled: false }, Validators.compose([Validators.email, Validators.required])));
          this.source.addControl('customer_profile_id', new FormControl({ value: '00000001', disabled: false }));
          this.source.addControl('expires_on', new FormControl({ value: '', disabled: false }));
          this.source.addControl(
            'products',
            this._formBuilder.array([
              this._formBuilder.group({
                product_id: ['0123456789', Validators.required],
                quantity: [1, Validators.required],
                price: [this.paymentDetails.value.amount, Validators.required],
                description: ['Demo Purchase Item', Validators.required]
              })
            ])
          );

          this.subscriptions.push(
            this.paymentDetails.get('amount').valueChanges.pipe(distinctUntilChanged()).subscribe(amount => (<FormArray>this.source.get('products')).controls[0].get('price').setValue(amount)),
            this.paymentDetails.get('customer.email').valueChanges.pipe(distinctUntilChanged()).subscribe(email => this.source.get('customer_email').setValue(email)),
            this.source.get('customer_email').valueChanges.pipe(distinctUntilChanged()).subscribe(email => this.paymentDetails.get('customer.email').setValue(email))
          );

          break;
        }
        case 'giropay': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('purpose', new FormControl({ value: 'Giropay Demo Payment', disabled: false }, Validators.required));
          this.source.addControl('bic', new FormControl({ value: null, disabled: false }));

          await this._banksService.getBanks(sourceType);

          break;
        }
        case 'googlepay': {
          this.autoCapture = false;
          this.threeDs = false;

          let initializeGooglePay = async () => {
            let loadedScripts = await this._scriptService.load('googlepay');
            if (loadedScripts.every(script => script.loaded)) {
              googleClient = new google.payments.api.PaymentsClient({
                environment: 'TEST'
              });
              googleClient.isReadyToPay({
                allowedPaymentMethods: ['CARD', 'TOKENIZED_CARD']
              })
                .then(response => {
                  if (response.result) {
                    this.setupPaymentAction(this.googlePayPaymentFlow);
                  }
                })
                .catch(error => console.error(error));
            }
          }

          initializeGooglePay();

          break;
        }
        case 'ideal': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('description', new FormControl({ value: 'iDEAL Demo Payment', disabled: false }, Validators.required));
          this.source.addControl('bic', new FormControl({ value: null, disabled: false }, Validators.required));
          this.source.addControl('language', new FormControl({ value: 'NL', disabled: false }));

          await this._banksService.getBanks(sourceType);

          break;
        }
        case 'klarna': {
          this.paymentDetails.get('capture').setValue(false);
          this.setupPaymentAction(this.klarnaPaymentFlow);
          this.klarnaCreditSessionResponse.enable();

          let requestKlarnaCreditSession = () => this.requestKlarnaSession(this.klarnaCreditSession.value).subscribe(klarnaCreditSessionResponse => handleKlarnaCreditSessionResponse(klarnaCreditSessionResponse));
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
              if ((klarnaCreditSessionResponse.body.payment_method_categories as []).length > 0) {
                await this._scriptService.load('klarna');
                await klarnaPaymentsInit(klarnaCreditSessionResponse.body.client_token);
                await klarnaPaymentsLoad();
                this.subscriptions.push(
                  this.paymentDetails.get('billing_address').valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(_ => klarnaPaymentsLoad()),
                  this.customer.valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(_ => klarnaPaymentsLoad())
                );
              }

              this.subscriptions.push(
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
                name: ['Demo Purchase Item', Validators.required],
                quantity: [1, Validators.required],
                unit_price: [this.paymentDetails.value.amount, Validators.required],
                tax_rate: [0, Validators.required],
                total_amount: [this.paymentDetails.value.amount, Validators.required],
                total_tax_amount: [0, Validators.required],
              })
            ])
          );

          this.subscriptions.push(
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(purchaseCountry => this.klarnaCreditSession.get('purchase_country').setValue(purchaseCountry)),
            this.paymentDetails.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(currency => this.klarnaCreditSession.get('currency').setValue(currency)),
            this.paymentDetails.get('amount').valueChanges.pipe(distinctUntilChanged(), debounceTime(1000)).subscribe(amount => this.klarnaCreditSession.patchValue({ amount: amount, products: [{ unit_price: amount, total_amount: amount }] })),
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
        case 'knet': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('language', new FormControl({ value: 'en', disabled: false }, Validators.required));
          this.source.addControl('user_defined_field1', new FormControl({ value: 'First user defined field', disabled: false }));
          this.source.addControl('user_defined_field2', new FormControl({ value: 'Second user defined field', disabled: false }));
          this.source.addControl('user_defined_field3', new FormControl({ value: '', disabled: false }));
          this.source.addControl('user_defined_field4', new FormControl({ value: 'Fourth user defined field', disabled: false }));
          this.source.addControl('user_defined_field5', new FormControl({ value: '', disabled: false }));
          this.source.addControl('card_token', new FormControl({ value: '01234567', disabled: false }, Validators.pattern('[0-9]{8}')));
          this.source.addControl('ptlf', new FormControl({ value: 'xxxx xxxxx xxxxx xxxxx', disabled: false }));

          this.subscriptions.push(
            this.source.get('user_defined_field3').valueChanges.pipe(distinctUntilChanged()).subscribe(_ => this.source.get('card_token').reset()),
            this.source.get('card_token').valueChanges.pipe(distinctUntilChanged()).subscribe(_ => this.source.get('user_defined_field3').reset()),
            this.source.get('user_defined_field5').valueChanges.pipe(distinctUntilChanged()).subscribe(_ => this.source.get('ptlf').reset()),
            this.source.get('ptlf').valueChanges.pipe(distinctUntilChanged()).subscribe(_ => this.source.get('user_defined_field5').reset())
          );

          break;
        }
        case 'multibanco': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('account_holder_name', new FormControl({ value: this.paymentDetails.get('customer.name').value, disabled: true }, Validators.required));
          this.source.addControl('payment_country', new FormControl({ value: this.paymentDetails.get('billing_address.country').value, disabled: true }, Validators.required));
          this.source.addControl('billing_descriptor', new FormControl({ value: 'Multibanco Demo Payment', disabled: false }));

          this.subscriptions.push(
            this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('account_holder_name').setValue(customerName)),
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(country => this.source.get('payment_country').setValue(country))
          );

          break;
        }
        case 'oxxo': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('integration_type', new FormControl({ value: 'redirect', disabled: true }, Validators.required));
          this.source.addControl('country', new FormControl({ value: this.paymentDetails.get('billing_address.country').value, disabled: true }, Validators.required));
          this.source.addControl('payer', new FormGroup({
            name: new FormControl({ value: this.paymentDetails.get('customer.name').value, disabled: true }, Validators.required),
            email: new FormControl({ value: this.paymentDetails.get('customer.email').value, disabled: true }, Validators.required),
            document: new FormControl({ value: 'WAKB700101HMCYNR06', disabled: false }, Validators.required),
          }));

          this.subscriptions.push(
            this.paymentDetails.get('customer.name').valueChanges.pipe(distinctUntilChanged()).subscribe(customerName => this.source.get('payer.name').setValue(customerName)),
            this.paymentDetails.get('customer.email').valueChanges.pipe(distinctUntilChanged()).subscribe(customerEmail => this.source.get('payer.email').setValue(customerEmail)),
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(country => this.source.get('country').setValue(country))
          );

          break;
        }

        case 'paypal': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('invoice_number', new FormControl({ value: this.paymentDetails.value.reference, disabled: true }, Validators.required));

          break;
        }
        case 'poli': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'p24': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('payment_country', new FormControl({ value: this.paymentDetails.value.billing_address.country, disabled: true }, Validators.required));
          this.source.addControl('account_holder_name', new FormControl({ value: this.paymentDetails.value.customer.name, disabled: true }, Validators.required));
          this.source.addControl('account_holder_email', new FormControl({ value: this.paymentDetails.value.customer.email, disabled: true }, Validators.compose([Validators.required, Validators.email])));
          this.source.addControl('billing_descriptor', new FormControl({ value: 'P24 Demo Payment', disabled: false }));

          this.subscriptions.push(
            this.paymentDetails.get('customer').valueChanges.pipe(distinctUntilChanged()).subscribe(customer => this.source.patchValue({ account_holder_name: customer.name, account_holder_email: customer.email }))
          );

          break;
        }
        case 'qpay': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('language', new FormControl({ value: 'en', disabled: false }));
          this.source.addControl('description', new FormControl({ value: 'QPay Demo Payment', disabled: false }, Validators.required));
          this.source.addControl('quantity', new FormControl({ value: 1, disabled: true }));
          this.source.addControl('national_id', new FormControl({ value: '03883377392282', disabled: false }));

          break;
        }
        case 'sepa': {
          this.setupPaymentAction(this.sourcesPaymentFlow, false, false);

          this.paymentConsent.enable();

          this.source.addControl('reference', new FormControl(this.paymentDetails.value.reference));
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
              first_name: [{ value: this.customer.value.given_name, disabled: true }, Validators.required],
              last_name: [{ value: this.customer.value.family_name, disabled: true }, Validators.required],
              account_iban: [{ value: 'DE25100100101234567893', disabled: false }, Validators.required],
              // PBNKDEFFXXX is the required value for bic in Sandbox
              bic: [{ value: 'PBNKDEFFXXX', disabled: true }, Validators.required],
              billing_descriptor: [{ value: 'SEPA Demo Payment', disabled: false }, Validators.required],
              mandate_type: [{ value: 'single', disabled: false }, Validators.required]
            })
          );

          this.source.get('billing_address').setValue(this.paymentDetails.get('billing_address').value);

          this.subscriptions.push(
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
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('country_code', new FormControl({ value: this.paymentDetails.value.billing_address.country, disabled: true }, Validators.required));

          this.subscriptions.push(
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(countryCode => {
              this.source.get('country_code').setValue(countryCode);
            })
          );

          break;
        }
        case 'wechat': {
          this.setupPaymentAction(this.standardPaymentFlow);

          this.source.addControl('wechat_type', new FormControl({ value: 'Web', disabled: false }, Validators.required));
          this.source.addControl('description', new FormControl({ value: 'WeChat Pay Demo Payment', disabled: false }, Validators.required));

          break;
        }
        case null: {
          break;
        }
        default: {
          this._makePayment = () => { throw new Error(`${sourceType} payment is not implemented yet!`) };
          throw new Error(`No ${sourceType} specific action was defined!`);
        }
      }
    } catch (e) {
      console.warn(e);
    }
    this.updateSourceType = true;
  }

  // API Methods
  requestToken(tokenRequest: any): any {
    return this._http.post<any>(`/api/checkout/tokens/source/wallet`, tokenRequest, { observe: 'response' });
  }

  requestKlarnaSession(creditSessionRequest): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/klarnaCreditSessions`, creditSessionRequest, { observe: 'response' });
  }

  getPayment(id: string): Observable<HttpResponse<IPayment>> {
    return this._http.get<IPayment>(`/api/checkout/payments/${id}`, { observe: 'response' });
  }

  requestPayment(paymentRequest: any): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/payments`, paymentRequest, { observe: 'response' });
  }

  requestSource(source: any): Observable<HttpResponse<any>> {
    return this._http.post<any>('/api/checkout/sources', source, { observe: 'response' });
  }

  getPaymentActions(id: string): Observable<HttpResponse<any>> {
    return this._http.get<any>(`/api/checkout/payments/${id}/actions`, { observe: 'response' })
  }

  performHypermediaAction(hypermediaRequest: HypermediaRequest): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/hypermedia`, hypermediaRequest, { observe: 'response' });
  }

  // Getters and Setters
  get source(): FormGroup {
    return <FormGroup>this.paymentDetails.get('source');
  }

  get processing(): FormGroup {
    return <FormGroup>this.paymentDetails.get('processing');
  }

  get paymentButtonIsDisabled(): boolean {
    return (this.paymentDetails ? this.paymentDetails.invalid : false) || (this.paymentConsent ? this.paymentConsent.invalid : false) || (this.klarnaCreditSessionResponse ? this.klarnaCreditSessionResponse.invalid : false) || this._processing;
  }

  get currencies(): ICurrency[] {
    return CURRENCIES;
  }

  get paymentMethods(): IPaymentMethod[] {
    return PAYMENT_METHODS;
  }

  set autoCapture(autoCapture: boolean) {
    let captureField = this.paymentDetails.get('capture');
    autoCapture ? captureField.enable() : captureField.disable();
  }

  set threeDs(threeDs: boolean) {
    let threeDsEnabledField = this.paymentDetails.get('3ds');
    threeDs ? threeDsEnabledField.enable() : threeDsEnabledField.disable();
  }

  // Syntactic Sugar
  public paymentMethodIcon(payment: IPayment): string {
    return payment.source.type == 'card' ? (<string>payment.source["scheme"]).toLowerCase() : payment.source.type;
  }

  private redirect(redirection: ILink): void {
    window.location.href = redirection.href;
  }

  public resetPayment(resetType: boolean = true): void {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
    Object.keys(this.source.controls).forEach(key => {
      if (key != 'type') {
        this.source.removeControl(key);
      } else if (resetType) {
        this.source.get(key).reset();
      }
    });
    this.autoCapture = true;
    this.threeDs = true;
    this.paymentConsent.reset();
    this.paymentConsent.disable();
    this.klarnaCreditSessionResponse.reset();
    this.klarnaCreditSessionResponse.disable();
    this.setProcessing(false);
  }

  private resetReference() {
    this.paymentDetails.get('reference').reset();
  }

  public setReferenceIfMissing() {
    if (!this.paymentDetails.value.reference) {
      this._shopService.getReference().subscribe(response => this.paymentDetails.get('reference').setValue(response.body.reference));
    }
  }
}
