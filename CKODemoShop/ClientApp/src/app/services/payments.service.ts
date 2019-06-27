import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { IPaymentMethod } from '../interfaces/payment-method.interface';
import { IBanks } from '../interfaces/banks.interface';
import { IPayment } from '../interfaces/payment.interface';
import { ICurrency } from '../interfaces/currency.interface';
import { ILink } from '../interfaces/link.interface';
import { HypermediaRequest } from '../components/hypermedia/hypermedia-request';

const DEFAULT_AMOUNT: number = 100;

const CURRENCIES: ICurrency[] = [
  { iso4217: 'AUD', base: 100 },
  { iso4217: 'BRL', base: 100 },
  { iso4217: 'CHF', base: 100 },
  { iso4217: 'EGP', base: 100 },
  { iso4217: 'EUR', base: 100 },
  { iso4217: 'GBP', base: 100 },
  { iso4217: 'KWD', base: 1000 },
  { iso4217: 'NOK', base: 100 },
  { iso4217: 'NZD', base: 100 },
  { iso4217: 'QAR', base: 100 },
  { iso4217: 'SEK', base: 100 },
  { iso4217: 'USD', base: 100 }
];

const PAYMENT_METHODS: IPaymentMethod[] = [
  {
    name: 'Credit Card (Frames)',
    type: 'cko-frames',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'Credit Card (PCI DSS)',
    type: 'card',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'Alipay',
    type: 'alipay',
    restrictedCurrencyCountryPairings: {
      'USD': ['CN']
    }
  },
  {
    name: 'Bancontact',
    type: 'bancontact',
    restrictedCurrencyCountryPairings: {
      'EUR': ['BE']
    }
  },
  {
    name: 'Boleto',
    type: 'boleto',
    restrictedCurrencyCountryPairings: {
      'BRL': ['BR'],
      'USD': ['BR']
    }
  },
  {
    name: 'EPS',
    type: 'eps',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AT']
    }
  },
  {
    name: 'Fawry',
    type: 'fawry',
    restrictedCurrencyCountryPairings: {
      'EGP': ['EG']
    }
  },
  {
    name: 'Giropay',
    type: 'giropay',
    restrictedCurrencyCountryPairings: {
      'EUR': ['DE']
    }
  },
  {
    name: 'Google Pay',
    type: 'googlepay',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'iDEAL',
    type: 'ideal',
    restrictedCurrencyCountryPairings: {
      'EUR': ['NL']
    }
  },
  {
    name: 'Klarna',
    type: 'klarna',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AT', 'DE', 'FI', 'NL'],
      'DKK': ['DK'],
      'GBP': ['GB'],
      'NOK': ['NO'],
      'SEK': ['SE']
    }
  },
  {
    name: 'KNET',
    type: 'knet',
    restrictedCurrencyCountryPairings: {
      'KWD': ['KW']
    }
  },
  {
    name: 'PayPal',
    type: 'paypal',
    restrictedCurrencyCountryPairings: null
  },
  {
    name: 'Poli',
    type: 'poli',
    restrictedCurrencyCountryPairings: {
      'AUD': ['AU'],
      'NZD': ['NZ']
    }
  },
  {
    name: 'QPay',
    type: 'qpay',
    restrictedCurrencyCountryPairings: {
      'QAR': ['QA']
    }
  },
  {
    name: 'SEPA Direct Debit',
    type: 'sepa',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AD', 'AT', 'BE', 'BG', 'CH', 'CY', 'CZ', 'DE', 'DK', 'EE', 'ES', 'FI', 'FR', 'GB', 'GR', 'HR', 'HU', 'IE', 'IS', 'IT', 'LI', 'LT', 'LU', 'LV', 'MC', 'MT', 'NL', 'NO', 'PL', 'PT', 'RO', 'SE', 'SI', 'SK', 'SM', 'VA']
    }
  },
  {
    name: 'Sofort',
    type: 'sofort',
    restrictedCurrencyCountryPairings: {
      'EUR': ['AT', 'BE', 'DE', 'ES', 'IT', 'NL']
    }
  }
]


@Injectable({
  providedIn: 'root'
})

export class PaymentsService {

  constructor(private _http: HttpClient) { }

  // Subjects
  private currencySource = new BehaviorSubject<ICurrency>(CURRENCIES.find(currency => currency.iso4217 == 'EUR'));
  private amountSource = new BehaviorSubject<number>(DEFAULT_AMOUNT);

  // Observables
  public currency$ = this.currencySource.asObservable();
  public amount$ = this.amountSource.asObservable();

  // Methods
  public setCurrency(currency: ICurrency) {
    this.currencySource.next(currency);
  }

  get currencies(): ICurrency[] {
    return CURRENCIES;
  }

  get paymentMethods(): IPaymentMethod[] {
    return PAYMENT_METHODS;
  }

  public setAmount(amount: number) {
    this.amountSource.next(amount);
  }

  paymentMethodIcon(payment: IPayment): string {
    return payment.source.type == 'card' ? (<string>payment.source["scheme"]).toLowerCase() : payment.source.type;
  }

  redirect(redirection: ILink): void {
    window.location.href = redirection.href;
  }

  getMonth(expiryDate: string): number {
    return Number.parseInt(expiryDate.slice(0, 2));
  }

  getYear(expiryDate: string): number {
    return Number.parseInt(expiryDate.slice(2, 6));
  }

  // API
  getLegacyBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<any>> {
    return this._http.get<any>(`/api/checkout/${paymentMethod.type}/banks`, { observe: 'response' });
  }

  getBanks(paymentMethod: IPaymentMethod): Observable<HttpResponse<IBanks>> {
    return this._http.get<IBanks>(`/api/checkout/${paymentMethod.type}/banks`, { observe: 'response' });
  }

  requestToken(tokenRequest: any): any {
    return this._http.post<any>(`/api/checkout/tokens/source/wallet`, tokenRequest, { observe: 'response' });
  }

  requestKlarnaSession(creditSessionRequest): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/klarna/creditSessions`, creditSessionRequest, { observe: 'response' });
  }

  getPayment(id: string): Observable<HttpResponse<IPayment>> {
    return this._http.get<IPayment>(`/api/checkout/payments/${id}`, { observe: 'response' });
  }

  requestPayment(paymentRequest: any): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/payments`, paymentRequest, { observe: 'response' });
  }

  getPaymentActions(id: string): Observable<HttpResponse<any>> {
    return this._http.get<any>(`/api/checkout/payments/${id}/actions`, { observe: 'response' })
  }

  performHypermediaAction(hypermediaRequest: HypermediaRequest): Observable<HttpResponse<any>> {
    return this._http.post<any>(`/api/checkout/hypermedia`, hypermediaRequest, { observe: 'response' });
  }
}
