import { Injectable } from '@angular/core';
import { OktaAuthService, UserClaims } from '@okta/okta-angular';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  constructor(private _oktaAuthService: OktaAuthService) {
    this.getOktaUser().then(oktaUser => this.setOktaUser(oktaUser));
  }

  // Subjects
  private oktaUserSource = new BehaviorSubject<UserClaims>(null);

  // Observables
  public oktaUser$ = this.oktaUserSource.asObservable();

  // Methods
  private setOktaUser(oktaUser: UserClaims) {
    this.oktaUserSource.next(oktaUser);
  }

  private async getOktaUser(): Promise<UserClaims> {
    return await this._oktaAuthService.getUser();
  }
}
