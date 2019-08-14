import { Component } from '@angular/core';
import { OktaAuthService } from '@okta/okta-angular';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html'
})
export class LoginComponent {
  constructor(private oktaAuth: OktaAuthService) { }

  login() {
    this.oktaAuth.loginRedirect('/');
  }
}
