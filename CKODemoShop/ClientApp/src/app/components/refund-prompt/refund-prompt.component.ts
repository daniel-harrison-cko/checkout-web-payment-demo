import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ICurrency } from '../../interfaces/currency.interface';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';

export interface DialogData {
  amount: number;
  currency: ICurrency;
  reference: string;
}

@Component({
  selector: 'app-refund-prompt',
  templateUrl: './refund-prompt.component.html',
})
export class RefundPromptComponent implements OnInit{
  currency: ICurrency = this.data.currency;
  maxRefund: number = this.data.amount;
  refundPromptDetails: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<RefundPromptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private _formBuilder: FormBuilder) { }

  ngOnInit() {
    this.refundPromptDetails = this._formBuilder.group({
      amount: [this.data.amount, Validators.compose([Validators.min(0), Validators.max(this.maxRefund), Validators.required])],
      reference: [this.data.reference]
    });
  }

  get refundDetails(): DialogData {
    return this.refundPromptDetails.value;
  }

  private get amount(): number {
    return this.refundDetails.amount;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
