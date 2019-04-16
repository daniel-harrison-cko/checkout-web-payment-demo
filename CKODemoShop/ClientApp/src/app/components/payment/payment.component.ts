import { Component, OnInit, OnDestroy, NgZone, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { PaymentsService } from '../../services/payments.service';
import { IPaymentMethod } from '../../interfaces/payment-method.interface';
import { Subscription } from 'rxjs';
import { HttpResponse } from '@angular/common/http';
import { ScriptService } from '../../services/script.service';
import { ITokenSource } from 'src/app/interfaces/token-source.interface';
import { Router } from '@angular/router';
import { IPayment } from 'src/app/interfaces/payment.interface';
import { SourcesService } from 'src/app/services/sources.service';
import { IIdSource } from 'src/app/interfaces/id-source.interface';
import { ISource } from 'src/app/interfaces/source.interface';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { distinctUntilChanged, filter } from 'rxjs/operators';

declare var Frames: any;
declare var google: any;
declare var Klarna: any;

@Component({
  selector: 'app-payment-component',
  templateUrl: './payment.component.html'
})
export class PaymentComponent implements OnInit, OnDestroy, AfterViewInit {
  subscriptions: Subscription[] = [];
  isLinear = true;
  paymentRequest: any;
  paymentDetails: FormGroup;
  listenToValueChanges: boolean;
  requiresConfirmationStep: boolean;
  sourceDetails: FormGroup;
  paymentConfirmation: FormGroup;
  creditorIdentifier: string = 'DE36ZZZ00001690322';
  processing: boolean;
  makePayment: Function;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentDetailsService: PaymentDetailsService,
    private _paymentService: PaymentsService,
    private _sourcesService: SourcesService,
    private _scriptService: ScriptService,
    private _router: Router,
    private _ngZone: NgZone
  ) { }

  ngOnInit() {
    this.paymentConfirmation = this._formBuilder.group({
      approved: [false, Validators.requiredTrue]
    });
    this.subscriptions.push(
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this._paymentDetailsService.listenToValueChanges$.subscribe(listenToValueChanges => this.listenToValueChanges = listenToValueChanges),
      this._paymentDetailsService.requiresConfirmationStep$.subscribe(requiresConfirmationStep => this.requiresConfirmationStep = requiresConfirmationStep)
    );
  }

  ngAfterViewInit() {
    this.subscriptions.push(
      this.paymentDetails.valueChanges.pipe(distinctUntilChanged(), filter(_ => this.listenToValueChanges)).subscribe(paymentDetails => this.paymentRequest = paymentDetails),
      this.paymentDetails.get('source.type').valueChanges.pipe(distinctUntilChanged()).subscribe(sourceType => this.invokePaymentMethod(sourceType))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  set autoCapture(autoCapture: boolean) {
    let captureField = this.paymentDetails.get('capture');
    autoCapture ? captureField.enable() : captureField.disable();
  }

  set threeDs(threeDs: boolean) {
    let threeDsEnabledField = this.paymentDetails.get('3ds');
    threeDs ? threeDsEnabledField.enable() : threeDsEnabledField.disable();
  }

  set paymentConfirmationRequired(paymentConfirmationRequired: boolean) {
    paymentConfirmationRequired ? this.paymentConfirmation.enable() : this.paymentConfirmation.disable();
  }

  private standardPaymentFlow = () => {
    this.processing = true;
    this._paymentService.requestPayment(this.paymentRequest).subscribe(
      response => this.handlePaymentResponse(response),
      error => {
        console.warn(error);
        this.processing = null;
      });
  };

  private invokePaymentMethod(sourceType: string) {
    switch (sourceType) {
      case 'card': {
        this.autoCapture = true;
        this.threeDs = true;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'alipay': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'bancontact': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'boleto': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'giropay': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'googlepay': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        let googleClient;
        let allowedPaymentMethods = ['CARD', 'TOKENIZED_CARD'];
        this._scriptService.load('googlepay')
          .then(data => {
            let isReadyToPayCallback = () => {
              this.makePayment = () => {
                this.processing = true;
                let processPayment = (paymentData) => {
                  this._paymentService.requestToken({
                    wallet_type: this.paymentDetails.value.source.type,
                    token_data: JSON.parse(paymentData.paymentMethodToken.token)
                  }).subscribe(
                    response => this.handleSourceResponse(response),
                    error => {
                      console.warn(error);
                      this.processing = null;
                    });
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
                    currencyCode: this.paymentDetails.value.currency,
                    totalPriceStatus: 'FINAL',
                    totalPrice: this.paymentDetails.value.amount
                  }
                };

                googleClient.loadPaymentData(paymentDataRequest)
                  .then(paymentData => processPayment(paymentData))
                  .catch(error => {
                    console.error(error);
                    this.processing = false;
                  });
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
      case 'ideal': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'paypal': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'poli': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      case 'sepa': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = true;

        this.makePayment = () => {
          this.processing = true;
          this._sourcesService.requestSource(this.paymentDetails.value.source).subscribe(
            response => this.handleSourceResponse(response),
            error => {
              console.warn(error);
              this.processing = null;
            });
        };
        break;
      }
      case 'sofort': {
        this.autoCapture = false;
        this.threeDs = false;
        this.paymentConfirmationRequired = false;

        this.makePayment = this.standardPaymentFlow;
        break;
      }
      default: {
        console.warn(`No ${sourceType} specific action was defined!`);
        this.makePayment = () => { throw new Error(`${sourceType} payment is not implemented yet!`) };
        break;
      }
    }
  }

  private LEGACYinvokePaymentMethod(paymentMethod: IPaymentMethod) {
    switch (paymentMethod.type) {
      case 'cko-frames': {
        this._scriptService.load('cko-frames')
          .then(data => {
            let cardTokenisedCallback = (event) => {
              this._paymentService.requestPayment({
                currency: this.paymentDetails.value.currency,
                amount: this.paymentDetails.value.amount,
                source: <ITokenSource>{
                  type: 'token',
                  token: event.data.cardToken
                },
                capture: this.paymentDetails.value.capture,
                '3ds': this.paymentDetails.value['3ds']
              }).subscribe(
                response => this.handlePaymentResponse(response),
                error => {
                  console.warn(error);
                  this.processing = null;
                });
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
      case 'klarna': {
        let klarnaAuthorizeCallback = (response) => {
          this._paymentService.requestPayment({
            currency: this.paymentDetails.value.currency,
            amount: this.paymentDetails.value.amount,
            source: {
              type: paymentMethod.type,
              authorization_token: response.authorization_token,
              locale: this.klarnaSession.get('locale').value,
              purchase_country: this.klarnaSession.get('purchase_country').value,
              tax_amount: this.klarnaSession.get('tax_amount').value,
              billing_address: this.klarnaSession.get('billing_address').value,
              products: this.klarnaSession.get('products').value
            }
          }).subscribe(
            response => this.handlePaymentResponse(response),
            error => {
              console.warn(error);
              this.processing = null;
            });
        };
        this.makePayment = () => {
          this.processing = true;
          Klarna.Payments.authorize({
            instance_id: 'cko-demo-klarna-instance'
          }, function (response) {
            console.log(response);
            klarnaAuthorizeCallback(response);
          })
        }
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
            currency: this.paymentDetails.value.currency,
            amount: this.paymentDetails.value.amount,
            source: source
          }).subscribe(
            response => this.handlePaymentResponse(response),
            error => {
              console.warn(error);
              this.processing = null;
            });
          break;
        }
        default: {
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
          this.processing = null;
          throw new Error(`Handling of response status ${response.status} is not implemented!`);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }

  paymentRoute(payment: IPayment) {
    this.addPaymentToLocalStorage(payment.id);
    this._ngZone.run(() => this._router.navigate([`/user/orders/${payment.id}`]));
  }

  paymentRedirect(payment: IPayment) {
    if (payment._links.redirect) {
      this.addPaymentToLocalStorage(payment.id);
      this._paymentService.redirect(payment._links.redirect);
    } else {
      this.paymentRoute(payment);
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
