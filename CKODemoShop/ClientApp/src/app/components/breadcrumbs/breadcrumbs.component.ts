import { Component, Input } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-breadcrumbs',
  templateUrl: './breadcrumbs.component.html'
})
export class BreadcrumbsComponent {
  @Input() appTitle: string;
  lastBreadcrumb: string;
  breadcrumbTrail: object;

  constructor(private _router: Router) {
    _router.events
      .pipe(
        filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this.breadcrumbTrail = {};
      let url: string = e["urlAfterRedirects"];
      let segments: string[] = url.split(/\//);
      segments = segments.slice(1, segments.length);
      this.lastBreadcrumb = segments.pop();
      segments.forEach((segment, index) =>
        this.breadcrumbTrail[index] = {
          name: segment,
          route: `${url.split(segment)[0]}${segment}`
        }
      );
    });
  }
}
