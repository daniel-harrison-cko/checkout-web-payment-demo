import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common'; 
import { OktaAuthService } from '@okta/okta-angular';
import { from } from 'rxjs';

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  constructor(@Inject(APP_BASE_HREF) private appBaseHref: string,
  private oktaAuth: OktaAuthService) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('http')) {
      //everything external, i.e. not our API
      return next.handle(req);
    } else {
      const apiReq = req.clone({ url: `${this.appBaseHref}${req.url}` });
      return from(this.handleAccess(apiReq, next));
    }
  }

  private delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  //Inspiration from https://devforum.okta.com/t/angular-access-token/2428/3
  private async handleAccess(request: HttpRequest<any>, next: HttpHandler): Promise<HttpEvent<any>> {
    // Only add to known domains since we don't want to send our tokens to just anyone.
    if(!this.shouldAddAccessToken(request)) {
      return next.handle(request).toPromise();
    }

    var accessToken = await this.oktaAuth.getAccessToken();

    //this seems to happen after first login - acessToken is null
    //despite us being authenticated. In that case we just loop 
    //and try to get a new accessToken after a while
    while(this.oktaAuth.isAuthenticated() && accessToken == null)
    {
      console.log("waiting for token...");
      await this.delay(4);
      console.log("done.");
      accessToken = await this.oktaAuth.getAccessToken();
    }

    request = request.clone({
      setHeaders: {
        Authorization: 'Bearer ' + accessToken
      }
    });

    return next.handle(request).toPromise();
  }

  private shouldAddAccessToken(request: HttpRequest<any>): boolean {
    return request.urlWithParams.indexOf('/api') > -1;
  }
}
