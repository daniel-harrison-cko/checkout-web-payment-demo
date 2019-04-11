import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

@Injectable({
  providedIn: 'root'
})

export class PaymentDetailsService {
  constructor(private _formBuilder: FormBuilder) { }

  // Subjects
  private paymentDetailsSource = new BehaviorSubject<FormGroup>(this.paymentDetailsTemplate);
  private listenToValueChangesSource = new BehaviorSubject<boolean>(true);

  // Observables
  public paymentDetails$ = this.paymentDetailsSource.asObservable();
  public listenToValueChanges$ = this.listenToValueChangesSource.asObservable();

  // Methods
  public updatePaymentDetails(paymentDetails: FormGroup) {
    this.paymentDetailsSource.next(paymentDetails);
  }
  public resumeListeningToValueChanges() {
    this.listenToValueChangesSource.next(true);
  }
  public stopListeningToValueChanges() {
    this.listenToValueChangesSource.next(false);
  }

  get paymentDetailsTemplate(): FormGroup {
    let paymentDetailsTemplate = this._formBuilder.group({
      amount: 0,
      currency: [null, Validators.required],
      source: this._formBuilder.group({
        type: [null, Validators.required]
      }),
      customer: this._formBuilder.group({
        id: null,
        email: ['bruce@wayne-enterprises.com', Validators.required],
        name: ['Bruce Wayne', Validators.required]
      }),
      billing_address: this._formBuilder.group({
        address_line1: ['Bruce Wayne'],
        address_line2: ['Wayne Plaza 1', Validators.required],
        city: ['Gotham City', Validators.required],
        state: ['NJ'],
        zip: ['12345', Validators.required],
        country: ['US', Validators.required]
      }),
      shipping: this._formBuilder.group({
        address: this._formBuilder.group({
          address_line1: ['Bruce Wayne', Validators.required],
          address_line2: ['Wayne Plaza 1', Validators.required],
          city: ['Gotham City', Validators.required],
          state: ['NJ'],
          zip: ['12345', Validators.required],
          country: ['US', Validators.required]
        }),
        phone: this._formBuilder.group({
          country_code: null,
          number: null
        })
      })
    });
    return paymentDetailsTemplate;
  }
}
