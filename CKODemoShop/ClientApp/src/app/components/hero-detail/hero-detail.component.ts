import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HeroService } from '../../services/hero.service';
import { IHero } from '../../interfaces/hero.interface';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';
import { OrderService } from 'src/app/services/order.service';

@Component({
  selector: 'hero-detail',
  templateUrl: './hero-detail.component.html'
})
export class HeroDetailComponent implements OnInit, OnDestroy {
  subscriptions: Subscription[] = [];
  hero: IHero;
  error: Error;
  name: string;
  pointsForm: FormGroup;

  constructor(private _heroService: HeroService, private _activatedRoute: ActivatedRoute, private _formBuilder: FormBuilder, private _orderService: OrderService) {
    _activatedRoute.params.subscribe(
      async (params: any) => {
        this.name = params['name'];
        if (this.name) {
          _heroService.getHero(this.name)
            .subscribe(
              response => this.hero = response.body,
              error => this.error = error
          );
        }
      }
    );
  }

  ngOnInit() {
    this.pointsForm = this._formBuilder.group({
      points: [1, [Validators.required, Validators.min(1)]]
    });

    this._orderService.addOrPatchProduct({name: 'Points', amount: this.pointsForm.get('points').value, unit: 1});

    this.subscriptions.push(
      this.pointsForm.get('points').valueChanges.pipe(debounceTime(1000), distinctUntilChanged()).subscribe(points => this._orderService.addOrPatchProduct({ name: 'Points', amount: points, unit: 1 }))
    );
  }

  ngOnDestroy() {
    this.subscriptions.forEach(subscription => subscription.unsubscribe());
  }
}
