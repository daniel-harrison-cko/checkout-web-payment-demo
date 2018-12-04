import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html'
})
export class ProductFormComponent implements OnInit {
  @Output() formReady = new EventEmitter<FormGroup>();
  productForm: FormGroup;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.productForm = this._formBuilder.group({
      amount: [1, [Validators.required, Validators.min(0)]]
    });

    this.formReady.emit(this.productForm);
  }
}
