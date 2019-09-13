import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl, FormArray, AbstractControl } from '@angular/forms';
import { IPaymentMethod } from 'src/app/interfaces/payment-method.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Subscription } from 'rxjs';
import { PaymentsService } from 'src/app/services/payments.service';
import { distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';
import { HttpResponse } from '@angular/common/http';
import { ScriptService } from 'src/app/services/script.service';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { CountriesService } from '../../services/countries.service';
import { ICountry } from '../../interfaces/country.interface';
import { BanksService } from '../../services/banks.service';

declare var Klarna: any;

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.component.html'
})

export class PaymentMethodFormComponent implements OnInit, OnDestroy {
  titles = ['Mr', 'Ms'];
  creditorIdentifier: string = 'DE36ZZZ00001690322';
  subscriptions: Subscription[] = [];
  paymentMethodSubsriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  customer: FormGroup;
  paymentConsent: FormGroup;
  countries: ICountry[];
  country: ICountry;
  selectedSourceType: string;
  creditCardForm: FormGroup;
  klarnaCreditSession: FormGroup;
  klarnaCreditSessionResponse: FormGroup = this._formBuilder.group({});
  bankForm: FormGroup;

  public paymentMethods = this._paymentsService.paymentMethods;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentsService: PaymentsService,
    private _banksService: BanksService,
    private _scriptService: ScriptService,
    private _countriesService: CountriesService,
    private _paymentDetailsService: PaymentDetailsService
  ) { }

  ngOnInit() {
    this.subscriptions.push(
      this._banksService.bankForm$.pipe().subscribe(bankForm => this.bankForm = bankForm),
      this._countriesService.countries$.pipe(distinctUntilChanged()).subscribe(countries => this.countries = countries),
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this._paymentDetailsService.customer$.pipe(distinctUntilChanged()).subscribe(customerFullName => this.customer = customerFullName),
      this._paymentDetailsService.paymentConsent$.pipe(distinctUntilChanged()).subscribe(paymentConsent => this.paymentConsent = paymentConsent),
      this.paymentDetails.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(currency => {
        let sourceType = this.paymentDetails.get('source.type').value;
        if (sourceType) {
          if (!this.sourceTypeSupportsCurrencyCountryPairing(sourceType)) {
            //this.resetPaymentMethod();
            this.paymentDetails.get('source.type').setValue(null);
          }
        }        
      }),
      //this.source.valueChanges.pipe(distinctUntilChanged()).subscribe(source => this.routePaymentMethod(source)),
      this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(alpha2Code => this.country = this.countries.find(country => country.alpha2Code == alpha2Code)),
      this.bankSearchInput.valueChanges.pipe(distinctUntilChanged()).subscribe(banksSearchInput => this._banksService.updateFilteredBanks(banksSearchInput))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  private sourceTypeSupportsCurrencyCountryPairing(sourceType: string): boolean {
    if (!sourceType) {
      return true;
    }
    let paymentMethod = this.paymentMethods.find(paymentMethod => paymentMethod.type == sourceType);
    if (paymentMethod.restrictedCurrencyCountryPairings == null) {
      return true;
    } else if (paymentMethod.restrictedCurrencyCountryPairings[this.paymentDetails.value.currency]) {
      return paymentMethod.restrictedCurrencyCountryPairings[this.paymentDetails.value.currency].includes(this.paymentDetails.value.billing_address.country);
    }
    return false;
  }

  private currencyBaseAmount(currencyCode: string): number {
    return this._paymentsService.currencies.find(currency => currency.iso4217 == currencyCode).base;
  }

  get sourceFieldsCount(): number {
    return Object.keys(this.source.controls).length;
  }

  get bankSearchInput(): FormControl {
    return <FormControl>this.bankForm.get('bankSearchInput');
  }

  get filteredBanks(): IBank[] {
    return <IBank[]>this.bankForm.get('filteredBanks').value;
  }

  get selectedBankControl(): FormControl {
    return <FormControl>this.bankForm.get('selectedBank');
  }

  get selectedBank(): IBank {
    return this.selectedBankControl.value;
  }

  get source(): FormGroup {
    return <FormGroup>this.paymentDetails.get('source');
  }

  get paymentMethodName(): string {
    return this.paymentDetails.value.source.type ? this.paymentMethods.find(element => element.type == this.paymentDetails.value.source.type).name : '';
  }

  private onBankSelectionChanged(event) {
    if (event.option.value) {
      let selectedBank: IBank = event.option.value;
      this.selectedBankControl.setValue(selectedBank);
      this.bankSearchInput.setValue(`${selectedBank.bic} ${selectedBank.name}`);
      this.source.get('bic').setValue(selectedBank.bic);
    }
  }

  private clearBankForm(...abstractControls: AbstractControl[]) {
    abstractControls.forEach(abstractControl => abstractControl.reset());
    this.source.get('bic').setValue(null);
  }

  private resetPaymentMethod = () => {
    this.paymentConsent.disable();
    this._banksService.resetBanks();
    this.bankForm.reset();
    this.paymentMethodSubsriptions.forEach(subscription => subscription.unsubscribe());
    this.paymentDetails.get('amount').setValue(100);
  }

  private routePaymentMethod = async (paymentMethod: IPaymentMethod) => {
    if (paymentMethod.type == this.paymentDetails.value.source.type) return;
    //this.resetPaymentMethod();
    try {
      switch (paymentMethod.type) {
        case 'klarna': {
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
              if ((klarnaCreditSessionResponse.body.payment_method_categories as []).length > 0) {
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
                name: ['Demo Purchase Item', Validators.required],
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
        case 'sofort': {
          this.source.addControl('country_code', new FormControl({ value: this.paymentDetails.value.billing_address.country, disabled: true }, Validators.required));
          this.source.addControl('language_code', new FormControl({ value: (this.country.languages[0].iso639_1 as string).toUpperCase(), disabled: false }, Validators.required));

          this.paymentMethodSubsriptions.push(
            this.paymentDetails.get('billing_address.country').valueChanges.pipe(distinctUntilChanged()).subscribe(countryCode => {
              this.source.get('country_code').setValue(countryCode);
              this.source.get('language_code').setValue((this.country.languages[0].iso639_1 as string).toUpperCase());
            })
          );

          break;
        }
        case null: {
          break;
        }
        default: {
          throw new Error(`Handling of Payment Method type ${paymentMethod.type} is not implemented!`);
        }
      }
    } catch (e) {
      console.warn(e);
    }
  }
}
