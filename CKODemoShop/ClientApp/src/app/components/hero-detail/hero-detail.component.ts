import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeroService } from '../../services/hero.service';
import { IHero } from '../../interfaces/hero.interface';

@Component({
  selector: 'hero-detail',
  templateUrl: './hero-detail.component.html'
})
export class HeroDetailComponent {
  private hero: IHero;
  private error: Error;
  private name: string;
  constructor(heroService: HeroService, activatedRoute: ActivatedRoute) {
    activatedRoute.params.subscribe(
      async (params: any) => {
        this.name = params['name'];
        if (this.name) {
          heroService.getHero(this.name)
            .subscribe(
              response => this.hero = response.body,
              error => this.error = error
          );
        }
      }
    );
  }
}
