import { Component } from '@angular/core';
import { HeroService } from '../../services/hero.service';
import { IHero } from '../../interfaces/hero.interface';

@Component({
  selector: 'heroes',
  templateUrl: './heroes.component.html'
})
export class HeroesComponent {
  private heroes: IHero[];

  constructor(heroService: HeroService) {
    heroService.getAllHeroes()
      .subscribe(
        response => this.heroes = response.body,
        error => console.error(error)
    );
  }
}
