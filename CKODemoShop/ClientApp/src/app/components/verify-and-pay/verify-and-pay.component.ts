import { Component, Input } from '@angular/core';
import { ICustomer } from '../../interfaces/customer.interface';

@Component({
  selector: 'app-verify-and-pay',
  templateUrl: './verify-and-pay.component.html'
})
export class VerifyAndPayComponent {
  @Input() customer: ICustomer
}
