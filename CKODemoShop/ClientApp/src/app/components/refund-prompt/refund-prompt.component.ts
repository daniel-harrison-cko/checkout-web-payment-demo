import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material';
import { ICurrency } from '../../interfaces/currency.interface';

export interface DialogData {
  amount: number;
  currency: ICurrency;
  reference: string;
}

@Component({
  selector: 'app-refund-prompt',
  templateUrl: './refund-prompt.component.html',
})
export class RefundPromptComponent {
  amount: number = this.data.amount;

  constructor(
    public dialogRef: MatDialogRef<RefundPromptComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData) { }

  onNoClick(): void {
    this.dialogRef.close();
  }
}
