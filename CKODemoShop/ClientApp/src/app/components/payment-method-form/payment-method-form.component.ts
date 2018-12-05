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
    name: 'iDeal',
    type: 'lpp_9'
  },
  {
    name: 'giropay',
    type: 'giropay'
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
  paymentMethodForm: FormGroup;
  creditCardForm: FormGroup;
  banks: IBank[];
  filteredBanks: Observable<IBank[]>;
  selectedBank: IBank;

  constructor(private _formBuilder: FormBuilder,
  private _paymentService: PaymentService) { }

  ngOnInit() {
    this.paymentMethodForm = this._formBuilder.group({
      selectedPaymentMethod: [null, Validators.required]
    });
    this.creditCardForm = this._formBuilder.group({
      number: ['4242424242424242', Validators.required],
      expiration: ['122022', Validators.required],
      cvv: ['100', [Validators.minLength(3), Validators.maxLength(4)]]
    });

    this.subscriptions.push(
      this.paymentMethodForm.get('selectedPaymentMethod').valueChanges.subscribe(paymentMethod => this.invokePaymentMethod(paymentMethod))
    );

    this.formReady.emit(this.paymentMethodForm);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get selectedPaymentMethod(): IPaymentMethod {
    return this.paymentMethodForm.get('selectedPaymentMethod').value;
  }

  get bank(): AbstractControl {
    return this.paymentMethodForm.get('bank');
  }

  get card(): AbstractControl {
    return this.paymentMethodForm.get('card');
  }

  private _bankFilter(value: string): IBank[] {
    const filterValue = value.toString().toLowerCase();
    return this.banks.filter(bank => { return (bank.value.toLowerCase().includes(filterValue) || bank.key.toLowerCase().includes(filterValue)) });
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

  private resetPaymentMethodForm = () => {
    this.banks = null;
    this.filteredBanks = null;
    this.selectedBank = null;
    if (this.bank) { this.paymentMethodForm.removeControl('bank') };
    if (this.card) { this.paymentMethodForm.removeControl('card') };
  }

  private onBankSelectionChanged() {
    let bankInput: FormControl = <FormControl>this.bank;
    let currentBank: IBank = bankInput.value;
    this.selectedBank = currentBank;
    //bankInput.setValue(`${currentBank.value} ${currentBank.key}`);
  }

  invokePaymentMethod(paymentMethod: IPaymentMethod) {
    this.resetPaymentMethodForm();
    switch (paymentMethod.type) {
      case 'lpp_9': {
        this.paymentMethodForm.setControl('bank', new FormControl(null, Validators.required));
        this.getBanksLegacy(paymentMethod);
        break;
      }
      case 'giropay': {
        this.paymentMethodForm.setControl('bank', new FormControl(null, Validators.required));
        this.getBanks(paymentMethod);
        break;
      }
      case 'cko-frames': {
        break;
      }
      case 'card': {
        this.paymentMethodForm.setControl('card', this.creditCardForm);
        break;
      }
      default: {
        throw new Error(`Handling of Payment Method type ${paymentMethod.type} is not implemented!`);
      }
    }
  }
}
