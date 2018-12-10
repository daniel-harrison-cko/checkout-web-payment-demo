import { Component, Output, OnInit, EventEmitter } from '@angular/core';
import { FormGroup, FormBuilder, Validators, FormControl } from '@angular/forms';

@Component({
  selector: 'app-payment-configuration-form',
  templateUrl: './payment-configuration-form.component.html'
})
export class PaymentConfigurationFormComponent implements OnInit {
  @Output() formReady = new EventEmitter<FormGroup>();
  paymentConfigurationForm: FormGroup;
  autoCapture: FormControl;
  threeDs: FormControl;

  constructor(private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.autoCapture = this._formBuilder.control(true, Validators.required);
    this.threeDs = this._formBuilder.control(false, Validators.required);
    this.paymentConfigurationForm = this._formBuilder.group({
      autoCapture: this.autoCapture,
      threeDs: this.threeDs
    });

    this.formReady.emit(this.paymentConfigurationForm);
  }
}
