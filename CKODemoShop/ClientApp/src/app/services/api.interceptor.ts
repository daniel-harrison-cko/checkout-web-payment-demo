import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';

@Injectable()
export class APIInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.url.startsWith('http')) {
      return next.handle(req);
    } else {
      const apiReq = req.clone({ url: `/demoshop-external${req.url}` });
      return next.handle(apiReq);
    }
  }
}
