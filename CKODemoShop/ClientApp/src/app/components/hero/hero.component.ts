import { Component, Input } from '@angular/core';
import { IHero } from '../../interfaces/hero.interface';

@Component({
  selector: 'hero',
  templateUrl: './hero.component.html'
})
export class HeroComponent {
  @Input() hero: IHero;

  constructor() {}
}
