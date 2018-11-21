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
  },
  {
    id: 'pay_czxos5rqcdae3pq4vua6u6nqpe',
    processed_on: '2018-11-20T16:06:48Z',
    source: {
      id: "src_f4ajregioj3e7lxqvd3s6st4yq",
      type: "card",
      billingAddress: null,
      phone: null,
      expiryMonth: 12,
      expiryYear: 2022,
      name: null,
      scheme: "Visa",
      last4: "4242",
      fingerprint: "D04A616512BC2055B2D4E73B5ABCB85ED8543B35A0BCBD89226D0A8312EE8CB8",
      bin: "424242",
      cardType: 0,
      cardCategory: 0,
      issuer: "JPMORGAN CHASE BANK NA",
      issuerCountry: "US",
      productId: "A",
      productType: "Visa Traditional",
      avsCheck: "S",
      cvvCheck: ""
    },
    amount: 100,
    currency: "EUR",
    reference: null,
    status: 2,
    '3ds': null,
    risk: {
      flagged: false
    },
    customer: {
      id: "cus_4ej5qxtuejzetfu6wcbpsxlxri",
      email: null,
      name: null
    },
    eci: null,
    _links: {
      self: {
        href: "https://api.sandbox.checkout.com/payments/pay_czxos5rqcdae3pq4vua6u6nqpe"
      },
      actions: {
        href: "https://api.sandbox.checkout.com/payments/pay_czxos5rqcdae3pq4vua6u6nqpe/actions"
      },
      refund: {
        href: "https://api.sandbox.checkout.com/payments/pay_czxos5rqcdae3pq4vua6u6nqpe/refunds"
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
