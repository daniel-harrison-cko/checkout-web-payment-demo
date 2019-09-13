import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormGroup, FormControl, AbstractControl } from '@angular/forms';
import { IBank } from 'src/app/interfaces/bank.interface';
import { Subscription } from 'rxjs';
import { PaymentsService } from 'src/app/services/payments.service';
import { distinctUntilChanged } from 'rxjs/operators';
import { PaymentDetailsService } from 'src/app/services/payment-details.service';
import { BanksService } from '../../services/banks.service';

@Component({
  selector: 'app-payment-method-form',
  templateUrl: './payment-method-form.component.html'
})

export class PaymentMethodFormComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  paymentDetails: FormGroup;
  paymentConsent: FormGroup;
  bankForm: FormGroup;
  klarnaCreditSession: FormGroup;
  klarnaCreditSessionResponse: FormGroup

  public paymentMethods = this._paymentsService.paymentMethods;

  constructor(
    private _paymentsService: PaymentsService,
    private _banksService: BanksService,
    private _paymentDetailsService: PaymentDetailsService
  ) { }

  ngOnInit() {
    this.klarnaCreditSession = this._paymentsService.klarnaCreditSession;
    this.klarnaCreditSessionResponse = this._paymentsService.klarnaCreditSessionResponse;
    this.subscriptions.push(
      this._banksService.bankForm$.pipe().subscribe(bankForm => this.bankForm = bankForm),
      this._paymentDetailsService.paymentDetails$.pipe(distinctUntilChanged()).subscribe(paymentDetails => this.paymentDetails = paymentDetails),
      this._paymentDetailsService.paymentConsent$.pipe(distinctUntilChanged()).subscribe(paymentConsent => this.paymentConsent = paymentConsent),
      this.paymentDetails.get('currency').valueChanges.pipe(distinctUntilChanged()).subscribe(_ => {
        let sourceType = this.paymentDetails.get('source.type').value;
        if (sourceType) {
          if (!this.sourceTypeSupportsCurrencyCountryPairing(sourceType)) {
            this.paymentDetails.get('source.type').setValue(null);
          }
        }        
      }),
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
}
