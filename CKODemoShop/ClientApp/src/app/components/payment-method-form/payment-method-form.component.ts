import { Component, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormArray, AbstractControl, FormControl } from '@angular/forms';
import { IPaymentMethod } from 'src/app/interfaces/payment-method.interface';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Observable, Subscription } from 'rxjs';
import { PaymentService } from 'src/app/services/payment.service';
import { startWith, map } from 'rxjs/operators';

const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card (Frames)',
    type: 'cko-frames'
  },
  {
    name: 'Credit Card (PCI DSS)',
    type: 'card'
  },
  {
    name: 'giropay',
    type: 'giropay'
  },
  {
    name: 'iDeal',
    type: 'lpp_9'
  },
  {
    name: 'SEPA Direct Debit',
    type: 'sepa'
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

  constructor(private _formBuilder: FormBuilder,
  private _paymentService: PaymentService) { }

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
      account_iban: ['DE25100100101234567893', Validators.required],
      bic: ['TESTDETT421'],
      verify_bic: [{ value: 'TESTDETT421', disabled: true}],
      billing_descriptor: ['CKO Demo Shop', Validators.required],
      mandate_type: ['single', Validators.required]
    });
    this.addressForm = this._formBuilder.group({
      address_line1: ['Wayne Plaza 1', Validators.required],
      address_line2: [''],
      city: ['Gotham City', Validators.required],
      state: ['NJ', Validators.required],
      zip: ['12345', Validators.required],
      country: ['USA', Validators.required]
    });

    this.subscriptions.push(
      this.paymentMethod.get('selectedPaymentMethod').valueChanges.subscribe(paymentMethod => this.invokePaymentMethod(paymentMethod))
    );

    this.formReady.emit(this.paymentMethod);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get selectedPaymentMethod(): IPaymentMethod {
    return this.paymentMethod.get('selectedPaymentMethod').value;
  }

  get bank(): AbstractControl {
    return this.paymentMethod.get('bank');
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
      case 'giropay': {
        this.paymentMethod.setControl('bank', new FormControl(null, Validators.required));
        this.paymentMethod.setControl('bankObject', new FormControl(null, Validators.required));
        this.getBanks(paymentMethod);
        break;
      }
      case 'lpp_9': {
        this.paymentMethod.setControl('bank', new FormControl(null, Validators.required));
        this.paymentMethod.setControl('bankObject', new FormControl(null, Validators.required));
        this.getBanksLegacy(paymentMethod);
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
