import { Component, OnInit, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, FormControl } from '@angular/forms';
import { PaymentService } from '../../services/payment.service';
import { IPaymentMethod } from '../../interfaces/payment-method.interface';
import { Subscription } from 'rxjs';
import { IIdealSource } from '../../interfaces/ideal-source.interface';
import { IGiropaySource } from '../../interfaces/giropay-source.interface';
import { HttpResponse } from '@angular/common/http';
import { ScriptService } from '../../services/script.service';
import { ITokenSource } from 'src/app/interfaces/token-source.interface';
import { Router } from '@angular/router';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { IPending } from 'src/app/interfaces/pending.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { ISourceData } from 'src/app/interfaces/source-data.interface';
import { SourcesService } from 'src/app/services/sources.service';
import { IIdSource } from 'src/app/interfaces/id-source.interface';
import { IBoletoSource } from 'src/app/interfaces/boleto-source.interface';
import { ISource } from 'src/app/interfaces/source.interface';

declare var Frames: any;
declare var google: any;

@Component({
  selector: 'app-payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent implements OnInit, OnDestroy, AfterViewInit {
  subscriptions: Subscription[] = [];
  isLinear = true;
  order: FormGroup;
  confirmation: FormGroup;
  sepaMandateAgreement: FormControl;
  creditorIdentifier: string = 'DE36ZZZ00001690322';
  processing: boolean;
  makePayment: Function;
  
  baseUri: string = window.location.origin;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentService: PaymentService,
    private _sourcesService: SourcesService,
    private _scriptService: ScriptService,
    private _router: Router,
    private _ngZone: NgZone
  ) { }

  formInitialized(name: string, form: FormGroup) {
    this.order.setControl(name, form);
  }

  controlInitialized(name: string, control: FormControl) {
    this.order.setControl(name, control);
  }

  ngOnInit() {    
    this.order = this._formBuilder.group({
      product: null,
      paymentMethod: null
    });
    this.sepaMandateAgreement = this._formBuilder.control(null, Validators.required);
    this.confirmation = this._formBuilder.group({
      sepaMandateAgreement: this.sepaMandateAgreement
    });


    this.order.updateValueAndValidity();
  }

  ngAfterViewInit() {
    this.subscriptions.push(
      this.paymentMethod.get('selectedPaymentMethod').valueChanges.subscribe(selectedPaymentMethod => this.invokePaymentMethod(selectedPaymentMethod))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get product(): AbstractControl {
    return this.order.get('product');
  }

  get autoCaptureControl(): AbstractControl {
    return this.order.get('paymentConfiguration.autoCapture');
  }

  get autoCapture(): boolean {
    return this.autoCaptureControl.value;
  }

  get threeDsControl(): AbstractControl {
    return this.order.get('paymentConfiguration.threeDs');
  }

  get threeDs(): boolean {
    return this.threeDsControl.value;
  }

  get paymentMethod(): AbstractControl {
    return this.order.get('paymentMethod');
  }

  get mandate(): AbstractControl {
    return this.paymentMethod.get('mandate');
  }

  get selectedPaymentMethod(): IPaymentMethod {
    return this.paymentMethod.get('selectedPaymentMethod').value;
  }

  get card(): string {
    return this.paymentMethod.get('card').value;
  }

  get bank(): IBank {
    return this.paymentMethod.get('bankObject').value;
  };

  get amountControl(): AbstractControl {
    return this.product.get('amount');
  };

  get amount(): number {
    return this.amountControl.value;
  };

  get currency(): string {
    return this.product.get('currency').value;
  }

  get accountHolder(): string {
    return this.mandate.get('account_holder').value;
  }

  get iban(): string {
    return this.mandate.get('account_iban').value;
  }

  get bic(): string {
    return this.mandate.get('bic').value;
  }

  get mandateType(): string {
    return this.mandate.get('mandate_type').value;
  }

  get address(): string {
    return this.paymentMethod.get('address').value;
  }

  get customerName(): string {
    return this.paymentMethod.get('customerName').value;
  }

  get cpf(): string {
    return this.paymentMethod.get('cpf').value;
  }

  get birthDate(): string {
    return this.paymentMethod.get('birthDate').value;
  }

  private resetOrder = () => {
    this.order.removeControl('confirmation');
  }

  private invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.resetOrder();
    switch (paymentMethod.type) {
      case 'cko-frames': {
        this.autoCaptureControl.enable();
        this.threeDsControl.enable();
        this._scriptService.load('cko-frames')
          .then(data => {
            let cardTokenisedCallback = (event) => {
              this._paymentService.requestPayment({
                currency: this.currency,
                amount: this.amount,
                source: <ITokenSource>{
                  type: 'token',
                  token: event.data.cardToken
                },
                capture: this.autoCapture,
                '3ds': {
                  enabled: this.threeDs
                },
                success_url: `${this.baseUri}/order/succeeded`,
                failure_url: `${this.baseUri}/order/failed`
              }).subscribe(response => this.handlePaymentResponse(response));
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
          })
          .catch(error => console.log(error));
        this.makePayment = () => {
          this.processing = true;
          Frames.submitCard();
        };
        break;
      }
      case 'card': {
        this.autoCaptureControl.enable();
        this.threeDsControl.enable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: {
              type: 'card',
              number: this.card["number"],
              expiry_month: Number((<string>this.card["expiration"]).slice(0, 2)),
              expiry_year: Number((<string>this.card["expiration"]).slice(2))
            },
            capture: this.autoCapture,
            '3ds': {
              enabled: this.threeDs
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response));
        };
        break;
      }
      case 'alipay': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: {
              type: paymentMethod.type
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'boleto': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: <IBoletoSource>{
              type: paymentMethod.type,
              customerName: this.customerName,
              cpf: this.cpf,
              birthDate: this.birthDate
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'lpp_9': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: <IIdealSource>{
              type: 'ideal',
              issuer_id: this.bank.value,
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'giropay': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: <IGiropaySource>{
              type: paymentMethod.type,
              purpose: 'CKO Demo Shop Test',
              bic: this.bank.value
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'googlepay': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        let googleClient;
        let allowedPaymentMethods = ['CARD', 'TOKENIZED_CARD'];
        this._scriptService.load('googlepay')
          .then(data => {
            let isReadyToPayCallback = () => {
              this.makePayment = () => {
                this.processing = true;
                let processPayment = (paymentData) => {
                  this._paymentService.requestToken({
                    wallet_type: paymentMethod.type,
                    token_data: JSON.parse(paymentData.paymentMethodToken.token)
                  }).subscribe(response => this.handleSourceResponse(response));
                };
                let paymentDataRequest = {
                  merchantId: '01234567890123456789',
                  paymentMethodTokenizationParameters: {
                    tokenizationType: 'PAYMENT_GATEWAY',
                    parameters: {
                      'gateway': 'checkoutltd',
                      'gatewayMerchantId': 'pk_test_3f148aa9-347a-450d-b940-0a8645b324e7'
                    }
                  },
                  allowedPaymentMethods: allowedPaymentMethods,
                  cardRequirements: {
                    allowedCardNetworks: ['MASTERCARD', 'VISA']
                  },
                  transactionInfo: {
                    currencyCode: this.currency,
                    totalPriceStatus: 'FINAL',
                    totalPrice: this.amount
                  }
                };

                googleClient.loadPaymentData(paymentDataRequest)
                  .then(paymentData => processPayment(paymentData))
                  .catch(error => console.error(error));
              };
            };
            googleClient = new google.payments.api.PaymentsClient({
              environment: 'TEST'
            });
            googleClient.isReadyToPay({
              allowedPaymentMethods: allowedPaymentMethods
            })
              .then(response => {
                if (response.result) {
                  isReadyToPayCallback();
                }
              })
              .catch(error => console.error(error));
          });
        break;
      }
      case 'sepa': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.sepaMandateAgreement.setValue(null);
        this.formInitialized('confirmation', this.confirmation);
        this.makePayment = () => {
          this.processing = true;
          this._sourcesService.requestSource({
            type: paymentMethod.type,
            billing_address: this.address,
            source_data: <ISourceData>this.mandate.value
          }).subscribe(response => this.handleSourceResponse(response))
        };
        break;
      }
      case 'poli': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: {
              type: paymentMethod.type
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      case 'sofort': {
        this.autoCaptureControl.disable();
        this.threeDsControl.disable();
        this.makePayment = () => {
          this.processing = true;
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: {
              type: paymentMethod.type
            },
            success_url: `${this.baseUri}/order/succeeded`,
            failure_url: `${this.baseUri}/order/failed`
          }).subscribe(response => this.handlePaymentResponse(response))
        };
        break;
      }
      default: {
        console.warn(`No ${paymentMethod.name} specific action was defined!`);
        this.makePayment = () => { throw new Error(`${paymentMethod.name} payment is not implemented yet!`) };
        break;
      }
    }
  }

  handleSourceResponse(response: HttpResponse<any>) {
    let source: ISource;
    try {
      if (response.body.id) {
        source = <IIdSource>{
          type: 'id',
          id: response.body.id
        }
      } else if (response.body.token) {
        source = <ITokenSource>{
          type: 'token',
          token: response.body.token
        }
      }
      else {
        throw new Error(`Unkown Source Type`);
      }
    }
    catch (e) {
      console.error(e);
    }
    try {
      switch (response.status) {
        case 201: {
          this._paymentService.requestPayment({
            currency: this.currency,
            amount: this.amount,
            source: source
          }).subscribe(response => this.handlePaymentResponse(response))
          break;
        }
        default: {
          this.order.get('paymentMethod').reset();
          this.processing = null;
          throw new Error(`Handling of response status ${response.status} is not implemented!`);
        }
      }
    }
    catch (e) {
      console.error(e);
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
          this.order.get('paymentMethod').reset();
          this.processing = null;
          throw new Error(`Handling of response status ${response.status} is not implemented!`);
        }
      }
    } catch (e) {
      console.error(e);
    }
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
