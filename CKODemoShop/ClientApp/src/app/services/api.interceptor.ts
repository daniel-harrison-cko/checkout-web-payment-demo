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
      return next.handle(req)
   }

   return from(this.handleAccess(req, next));
  }

  //Inspiration from https://devforum.okta.com/t/angular-access-token/2428/3
  private async handleAccess(request: HttpRequest<any>, next: HttpHandler): Promise<HttpEvent<any>> {
    // Only add to known domains since we don't want to send our tokens to just anyone.
    if(!this.shouldAddAccessToken(request)) {
      console.log("not handling " + request.url);
      return next.handle(request).toPromise();
    }

    const accessToken = await this.oktaAuth.getAccessToken();
    request = request.clone({
      setHeaders: {
        Authorization: 'Bearer ' + accessToken
      }
    });
    console.log(accessToken);
    return next.handle(request).toPromise();
  }

  private shouldAddAccessToken(request: HttpRequest<any>): boolean {
    return request.urlWithParams.indexOf('/api') > -1;
  }
}
