import { Page } from '../pages/page.po';
import { browser, ExpectedConditions } from 'protractor';

describe('Web Payment Demo', () => {
    let page: Page;

    beforeEach(() => {
        page = new Page();
    });

    describe('on open', () => {
        beforeEach(() => {
            browser.waitForAngularEnabled(false);
            page.navigateTo('/');
        });

        it('should redirect to Okta login', () => {
            browser.wait(ExpectedConditions.urlContains('https://dev-320726.okta.com/login/login.htm'), 5000);
        });
    });
});
