import { Component, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators, AbstractControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICurrency } from 'src/app/interfaces/currency.interface';
import { PaymentsService } from 'src/app/services/payments.service';
import { distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html'
})

export class ProductFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  private _currency: ICurrency;
  @Output() formReady = new EventEmitter<FormGroup>();
  productForm: FormGroup;

  constructor(
    private _paymentsService: PaymentsService,
    private _formBuilder: FormBuilder
  ) { }

  ngOnInit() {
    this.productForm = this._formBuilder.group({
      amount: [null, [Validators.required, Validators.min(0)]],
      currency: [null, Validators.required]
    });

    this.formReady.emit(this.productForm);

    this.subscriptions.push(
      this._paymentsService.amount$.subscribe(amount => this.amount = amount),
      this.getControl('amount').valueChanges.pipe(distinctUntilChanged()).subscribe(amount => this._paymentsService.setAmount(amount)),
      this._paymentsService.currency$.subscribe(currency => this.currency = currency)
    );
  }

  private getControl(path: string): AbstractControl {
    return this.productForm.get(path);
  }

  get amount(): number {
    return this.getControl('amount').value;
  }

  set amount(amount: number) {
    this.getControl('amount').setValue(amount);
  }

  get currency(): ICurrency {
    return this._currency;
  }

  set currency(currency: ICurrency) {
    this._currency = currency;
    this.getControl('currency').setValue(currency.iso4217);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
