import { Injectable, Inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { APP_BASE_HREF } from '@angular/common'; 

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  constructor(@Inject(APP_BASE_HREF) private appBaseHref: string) { }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('http')) {
      return next.handle(req);
    } else {
      console.log(this.appBaseHref);
      const apiReq = req.clone({ url: `${this.appBaseHref}${req.url}` });
      return next.handle(apiReq);
    }
  }
}
