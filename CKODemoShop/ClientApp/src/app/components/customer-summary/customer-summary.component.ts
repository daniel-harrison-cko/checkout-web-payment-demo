import { Component, Input } from '@angular/core';
import { ICustomer } from '../../interfaces/customer.interface';

@Component({
  selector: 'app-customer-summary',
  templateUrl: './customer-summary.component.html'
})
export class CustomerSummaryComponent {
@Input() customer: ICustomer
}
