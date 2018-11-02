import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Hero } from '../../classes/hero';

@Component({
  selector: 'hero-detail',
  templateUrl: './hero-detail.component.html'
})
export class HeroDetailComponent {
  private hero: Hero;
  private name: string;
  constructor(private activatedRoute: ActivatedRoute) {
    this.activatedRoute.params.subscribe(
      async (params: any) => {
        this.name = params['name'];
      }
    );
  }
}
