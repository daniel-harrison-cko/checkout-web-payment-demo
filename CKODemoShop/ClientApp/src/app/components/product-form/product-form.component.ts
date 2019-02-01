import { Component, Output, OnInit, EventEmitter, OnDestroy } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ICurrency } from 'src/app/interfaces/currency.interface';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  currency: ICurrency;
  @Output() formReady = new EventEmitter<FormGroup>();
  productForm: FormGroup;

  constructor(private _formBuilder: FormBuilder, private _orderService: OrderService) { }

  ngOnInit() {
    this.productForm = this._formBuilder.group({
      amount: [100, [Validators.required, Validators.min(0)]],
      currency: [null, Validators.required]
    });

    this.formReady.emit(this.productForm);

    this.subscriptions.push(
      this._orderService.currency$.subscribe(currency => {
        this.currency = currency;
        this.productForm.get('currency').setValue(currency.iso4217);
      })
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }

  get amount(): number {
    return this.productForm.get('amount').value;
  }
}
