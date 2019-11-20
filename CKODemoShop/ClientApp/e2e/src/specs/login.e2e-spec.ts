import { browser, ExpectedConditions } from 'protractor';
import { LoginPage } from '../pages/login-page.po';

describe('Login', () => {
    let loginPage: LoginPage;

    beforeAll(() => {
        loginPage = new LoginPage();
        browser.waitForAngularEnabled(false);
        loginPage.navigateTo('/');
    });

    beforeEach(() => {
        browser.waitForAngular();
    });

    describe('on open Web Payment Demo', () => {

        it('should route to Okta login', () => {
            browser.wait(ExpectedConditions.urlContains(browser.params.okta.domain), 5000, 'did not route to Okta login');
        });

        it('should log in successfully with demo account', () => {
            loginPage.login(browser.params.okta.username, browser.params.okta.password);
            browser.wait(ExpectedConditions.titleContains('Payment Demo'), 15000, 'did not log in successfully');
        });
    });
});
