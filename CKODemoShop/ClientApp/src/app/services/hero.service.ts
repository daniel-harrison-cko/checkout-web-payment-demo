import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { IHero } from '../interfaces/hero.interface';

@Injectable({
  providedIn: 'root'
})
export class HeroService {
  constructor(private http: HttpClient) { }

  getHero(name: string) {
    return this.http.get<IHero>(`/api/sampledata/gethero/${name}`, {observe: 'response'});
  }

  getAllHeroes() {
    return this.http.get<IHero[]>(`/api/sampledata/getallheroes`, { observe: 'response' });
  }
}
