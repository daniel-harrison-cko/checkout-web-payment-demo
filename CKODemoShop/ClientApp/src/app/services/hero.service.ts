import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { IHero } from '../interfaces/hero.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HeroService {
  constructor(private http: HttpClient) { }

  getHero(name: string): Observable<HttpResponse<IHero>> {
    return this.http.get<IHero>(`/api/sampledata/gethero/${name}`, {observe: 'response'});
  }

  getAllHeroes(): Observable<HttpResponse<IHero[]>> {
    return this.http.get<IHero[]>(`/api/sampledata/getallheroes`, { observe: 'response' });
  }
}
