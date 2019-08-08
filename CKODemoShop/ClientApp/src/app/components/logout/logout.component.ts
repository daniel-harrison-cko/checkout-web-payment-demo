import { Component } from '@angular/core';
import { OktaAuthService } from '@okta/okta-angular';

@Component({
  selector: 'logout',
  templateUrl: './logout.component.html'
})
export class LogoutComponent {
  constructor(
    private oktaAuth: OktaAuthService
  ) 
  {
  }

  login() {
    this.oktaAuth.loginRedirect('/');
  }
}
