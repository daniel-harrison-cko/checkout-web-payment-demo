import { Injectable } from '@angular/core';
import { Location } from '@angular/common';
import { IWebPaymentDemoEnvironment } from '../interfaces/web-payment-demo-environment.interface';

const WEBPAYMENTDEMOENVIRONMENTS: IWebPaymentDemoEnvironment[] = [
  {
    name: 'Development',
    url: null,
    matIcon: 'code'
  },
  {
    name: 'QA',
    url: 'https://payment-demo-qa.ckotech.co',
    matIcon: 'assignment_turned_in'
  },
  {
    name: 'Sandbox',
    url: 'https://payment-demo-sb.ckotech.co',
    matIcon: 'sports_esports'
  },
  {
    name: 'Production',
    url: 'https://payment-demo.ckotech.co',
    matIcon: 'storefront'
  }
];

@Injectable({
  providedIn: 'root'
})
export class AppConfigService {
  private _config: any;

  constructor(private location: Location) { }

  async loadConfiguration() {

    let configUrl = this.location.prepareExternalUrl('/api/config');

    //don't really like to use window here, as it might be hard to unit-test
    //but didn't really find anything else 
    let redirectUrl = window.origin + this.location.prepareExternalUrl('/implicit/callback');

    //we're using fetch here instead of HttpClient, since otherwise the HttpClient interceptor kicks in,
    //initializing Okta before we can actually read the settings. 
    let config = await (await fetch(configUrl)).json();

    this._config = {
      'clientId': config.client_id,
      'issuer': config.issuer,
      'redirectUri': redirectUrl,
      'publicKey': config.public_key,
      'environment': config.environment
    };
  }

  public get config(): any {
    return this._config;
  }

  public get isLoaded(): boolean {
    return this._config != null;
  }

  public get webPaymentDemoEnvironments(): IWebPaymentDemoEnvironment[] {
    return WEBPAYMENTDEMOENVIRONMENTS;
  }

  public switchEnvironment(webPaymentDemoEnvironment: IWebPaymentDemoEnvironment): void {
    window.location.href = webPaymentDemoEnvironment.url;
  }

  public isCurrentEnvironment(webPaymentDemoEnvironment: IWebPaymentDemoEnvironment): boolean {
    return this.config.environment.toLowerCase() == webPaymentDemoEnvironment.name.toLowerCase();
  }
}
