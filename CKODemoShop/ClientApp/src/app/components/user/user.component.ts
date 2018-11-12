import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ICustomer } from '../../interfaces/customer.interface';
import { IPayment } from '../../interfaces/payment.interface';
import { MatTableDataSource, MatSort } from '@angular/material';
import { UserService } from '../../services/user.service';

const USER: ICustomer = {
  id: '123',
  name: 'Philippe Leonhardt',
  email: 'philippe.leonhardt@checkout.com'
}

const ORDERS: IPayment[] = [
  {
    id: 'pay_b33regntng2ernkjhaou2hqbui',
    action_id: 'act_b33regntng2ernkjhaou2hqbui',
    amount: 100,
    currency: 'EUR',
    approved: false,
    status: 3,
    response_code: '20046',
    response_summary: 'Bank Decline',
    source: null,
    customer: {
      id: 'cus_k4qs252s7smubfcxyqalldmaoy',
      name: null,
      email: null
    },
    processed_on: '2018-11-12T11:06:19Z',
    _links: {
      self: {
        href: 'https://api.sandbox.checkout.com/payments/pay_b33regntng2ernkjhaou2hqbui'
      },
      actions: {
        href: 'https://api.sandbox.checkout.com/payments/pay_b33regntng2ernkjhaou2hqbui/actions'
      }
    }
  }
]

@Component({
  selector: 'app-user',
  templateUrl: './user.component.html'
})
export class UserComponent {
  user: ICustomer = USER;
  displayedColumns: string[] = ['processed', 'id', 'amount', 'approved'];
  dataSource = new MatTableDataSource(ORDERS);

  @ViewChild(MatSort) sort: MatSort;

  ngOnInit() {
    this.dataSource.sort = this.sort;
  }

  constructor(userService: UserService, activatedRoute: ActivatedRoute) {
    console.log(activatedRoute.snapshot.params['id']);
  }

  openPayment(id: string) {
    alert(id);
  }
}
