import { browser, by, element } from 'protractor';
import { Page } from './page.po';
import { protractor } from 'protractor/built/ptor';

export class LoginPage extends Page {
    username = element(by.name('username'));
    password = element(by.name('password'));
    oktaLoginButton = element(by.css('input[type=submit]'));
    loginButton = element(by.css('#login'));
    logoutButton = element(by.css('#logout'));
    header = element(by.css('ion-title'));

    getHeader() {
        return this.header.getText();
    }

    setUserName(username) {
        this.username.sendKeys(username);
    }

    getUserName() {
        return this.username.getAttribute('value');
    }

    clearUserName() {
        this.username.clear();
    }

    setPassword(password) {
        this.password.sendKeys(password);
    }

    getPassword() {
        return this.password.getAttribute('value');
    }

    clearPassword() {
        this.password.clear();
    }

    login(username: string, password: string) {
        let deferred = protractor.promise.defer();
        // Entering non angular site, tell webdriver to switch to synchronous mode.
        browser.waitForAngularEnabled(false);
        this.username.isPresent().then(() => {
            this.username.sendKeys(username);
            this.password.sendKeys(password);
            this.oktaLoginButton.click();
            return deferred.fulfill();
        }).catch(error => {
            browser.waitForAngularEnabled(true);
            return deferred.reject();
        });
        return deferred;
    }

    clickLoginButton() {
        return this.loginButton.click();
    }

    logout() {
        return this.logoutButton.click();
    }
}
