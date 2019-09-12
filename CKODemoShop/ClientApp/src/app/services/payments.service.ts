import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, Subscription } from 'rxjs';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IPayment } from '../interfaces/payment.interface';
import { ICurrency } from '../interfaces/currency.interface';
import { ILink } from '../interfaces/link.interface';
import { HypermediaRequest } from '../components/hypermedia/hypermedia-request';
import { Router } from '@angular/router';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { PaymentDetailsService } from './payment-details.service';
import { distinctUntilChanged, finalize, filter } from 'rxjs/operators';
import { ScriptService } from './script.service';
import { AppConfigService } from './app-config.service';
import { ShopService } from './shop.service';
import { BanksService } from './banks.service';

declare var Frames: any;
declare var google: any;
var googleClient: any;
declare var Klarna: any;

const CURRENCIES: ICurrency[] = [
  { iso4217: 'AUD', base: 100 },
  { iso4217: 'BRL', base: 100 },
  { iso4217: 'CHF', base: 100 },
  { iso4217: 'EGP', base: 100 },
  { iso4217: 'EUR', base: 100 },
  { iso4217: 'GBP', base: 100 },
  { iso4217: 'KWD', base: 1000 },
  { iso4217: 'NOK', base: 100 },
  { iso4217: 'NZD', base: 100 },
  { iso4217: 'PLN', base: 100 },
  { iso4217: 'QAR', base: 100 },
  { iso4217: 'SEK', base: 100 },
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
  }
]

@Injectable({
  providedIn: 'root'
})

export class PaymentsService {
  private subscriptions: Subscription[] = [];
  private paymentDetails: FormGroup;
  private paymentConsent: FormGroup;
  private paymentRequest: any;
  private _makePayment: Function;
  private _processing: boolean;
  private updateSourceType: boolean = true;

  constructor(
    private _appConfigService: AppConfigService,
    private _http: HttpClient,
    private _banksService: BanksService,
    private _paymentDetailsService: PaymentDetailsService,
    private _shopService: ShopService,
    private _scriptService: ScriptService,
    private _router: Router,
    private _ngZone: NgZone
  ) {
    this._paymentDetailsService.paymentDetails$.subscribe(paymentDetails => this.paymentDetails = paymentDetails);
    this._paymentDetailsService.paymentConsent$.pipe(distinctUntilChanged()).subscribe(paymentConsent => this.paymentConsent = paymentConsent);
    this.processing$.pipe(distinctUntilChanged()).subscribe(processing => this._processing = processing);
    this.paymentDetails.get('source.type').valueChanges.pipe(distinctUntilChanged(), filter(_ => this.updateSourceType)).subscribe(sourceType => this.setupPaymentMethod(sourceType));
    this.paymentDetails.valueChanges.pipe(distinctUntilChanged()).subscribe(() => this.paymentRequest = this.paymentDetails.getRawValue());
  }

  // Subjects
  private processingSource = new BehaviorSubject<boolean>(false);

  // Observables
  public processing$ = this.processingSource.asObservable();

  // Subjects Methods
  public setProcessing(isProcessing: boolean) {
    this.processingSource.next(isProcessing);
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
          console.warn(error);
          this.resetPayment();
        });
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
          this.paymentDetails.get('capture').setValue(true);
          this.setupPaymentAction(this.standardPaymentFlow, true, true);

          this.source.addControl('number', new FormControl({ value: '4242424242424242', disabled: false }, Validators.required));
          this.source.addControl('expiry_month', new FormControl({ value: 12, disabled: false }, Validators.compose([Validators.required, Validators.min(1), Validators.max(12)])));
          this.source.addControl('expiry_year', new FormControl({ value: 2022, disabled: false }, Validators.required));
          this.source.addControl('name', new FormControl({ value: this.paymentDetails.value.customer.name, disabled: true }));
          this.source.addControl('cvv', new FormControl({ value: '100', disabled: false }, Validators.compose([Validators.minLength(3), Validators.maxLength(4)])));
          this.source.addControl('billing_address', new FormControl({ value: this.paymentDetails.value.billing_address, disabled: true }));

          break;
        }
        case 'ach': {
          this.setupPaymentAction(this.sourcesPaymentFlow, false, false);
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
        case 'boleto': {
          this.setupPaymentAction(this.standardPaymentFlow);
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
          break;
        }
        case 'knet': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'paypal': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'poli': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'p24': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'qpay': {
          this.setupPaymentAction(this.standardPaymentFlow);
          break;
        }
        case 'sepa': {
          this.setupPaymentAction(this.sourcesPaymentFlow, false, false);
          break;
        }
        case 'sofort': {
          this.setupPaymentAction(this.standardPaymentFlow);
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

  get paymentButtonIsDisabled(): boolean {
    return (this.paymentDetails ? this.paymentDetails.invalid : false) || (this.paymentConsent ? this.paymentConsent.invalid : false) || this._processing;
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
