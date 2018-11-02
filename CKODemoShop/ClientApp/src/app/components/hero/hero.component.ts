import { Component, Input } from '@angular/core';
import { Hero } from '../../classes/hero';

@Component({
  selector: 'hero',
  templateUrl: './hero.component.html'
})
export class HeroComponent {
  @Input() hero: Hero;

  constructor() {}
}
