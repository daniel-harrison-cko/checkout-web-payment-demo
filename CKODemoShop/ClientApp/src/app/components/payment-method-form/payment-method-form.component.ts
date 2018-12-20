import { Component, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl, FormControl } from '@angular/forms';
import { IPaymentMethod } from 'src/app/interfaces/payment-method.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Observable, Subscription } from 'rxjs';
import { PaymentService } from 'src/app/services/payment.service';
import { startWith, map } from 'rxjs/operators';
import { ICurrency } from 'src/app/interfaces/currency.interface';
import { AppService } from 'src/app/services/app.service';

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
    name: 'giropay',
    type: 'giropay',
    processingCurrencies: ['EUR']
  },
  {
    name: 'iDEAL',
    type: 'lpp_9',
    processingCurrencies: ['EUR']
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

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.component.html'
})
export class PaymentMethodFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  @Output() formReady = new EventEmitter<FormGroup>();
  paymentMethods: IPaymentMethod[] = PAYMENT_METHODS;
  paymentMethod: FormGroup;
  creditCardForm: FormGroup;
  mandateForm: FormGroup;
  addressForm: FormGroup;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedCurrency: ICurrency;

  constructor(
    private _formBuilder: FormBuilder,
    private _paymentService: PaymentService,
    private _appService: AppService
  ) { }

  ngOnInit() {
    this.paymentMethod = this._formBuilder.group({
      selectedPaymentMethod: [null, Validators.required]
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
      addressLine1: ['Wayne Plaza 1', Validators.required],
      addressLine2: [''],
      city: ['Gotham City', Validators.required],
      state: ['NJ', Validators.required],
      zip: ['12345', Validators.required],
      country: ['US', Validators.required]
    });

    this.subscriptions.push(
      this.paymentMethod.get('selectedPaymentMethod').valueChanges.subscribe(paymentMethod => this.invokePaymentMethod(paymentMethod)),
      this._appService.currency$.subscribe(currency => this.selectedCurrency = currency)
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

  private deselectBank() {
    this.bankObject.reset();
  }

  private _bankFilter(value: string): IBank[] {
    if (!value) {
      return this.banks;
    } else {
      const filterValue = value.toString().toLowerCase();
      return this.banks.filter(bank => { return `${bank.value.toLowerCase()} ${bank.key.toLowerCase()}`.includes(filterValue) });
    }    
  }

  getBanksLegacy(paymentMethod: IPaymentMethod) {
    this._paymentService.getLegacyBanks(paymentMethod).subscribe(response => {
      this.banks = response.body
      this.filteredBanks = (<FormControl>this.bank).valueChanges.pipe(
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
      this.filteredBanks = (<FormControl>this.bank).valueChanges.pipe(
        startWith(''),
        map(value => this._bankFilter(value))
      );
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
  }

  private onBankSelectionChanged() {
    let bankInput: FormControl = <FormControl>this.bank;
    if (bankInput.value) {
      let currentBank: IBank = bankInput.value;
      this.bankObject.setValue(currentBank);
      bankInput.setValue(`${currentBank.value} ${currentBank.key}`);
    }    
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
