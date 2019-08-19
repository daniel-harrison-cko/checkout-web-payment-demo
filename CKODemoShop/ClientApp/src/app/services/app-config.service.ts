import { Injectable } from '@angular/core';
import { Location } from '@angular/common';

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
      'redirectUri': redirectUrl
    };
  }

  public getConfig(): object {
    return this._config;
  }

  public get isLoaded(): boolean {
    return this._config != null;
  }
}
