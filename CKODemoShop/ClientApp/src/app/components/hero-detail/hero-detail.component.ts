import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeroService } from '../../services/hero.service';
import { IHero } from '../../interfaces/hero.interface';
import { FormBuilder, Validators } from '@angular/forms';

@Component({
  selector: 'hero-detail',
  templateUrl: './hero-detail.component.html'
})
export class HeroDetailComponent {
  private hero: IHero;
  private error: Error;
  private name: string;
  pointsForm = this.formBuilder.group({
    points: [1, [Validators.required, Validators.min(1)]]
  });

  constructor(heroService: HeroService, activatedRoute: ActivatedRoute, private formBuilder: FormBuilder) {
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
