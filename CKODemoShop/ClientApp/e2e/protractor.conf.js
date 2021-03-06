// Protractor configuration file, see link for more information
// https://github.com/angular/protractor/blob/master/lib/config.ts

const { SpecReporter } = require('jasmine-spec-reporter');

exports.config = {
    allScriptsTimeout: 11000,
    capabilities: {
        browserName: 'chrome',
        shardTestFiles: true,
        maxInstances: 3
    },
    specs: [
        './src/**/ideal.e2e-spec.ts',
        './src/**/klarna.e2e-spec.ts',
        './src/**/oxxo.e2e-spec.ts'
    ],
    params: {
        okta: {
            domain: 'https://dev-320726.okta.com/',
            username: 'username',
            password: 'password'
        },
        ideal: {
            country: 'NL',
            currency: 'EUR',
            bank: 'INGBNL2A Issuer Simulation V3 - ING',
            deferredRefund: true
        },
        klarna: {
            country: 'DE',
            currency: 'EUR',
            dateOfBirth: '01.01.1970',
            deferredRefund: false
        },
        oxxo: {
            country: 'MX',
            currency: 'MXN',
            deferredRefund: true
        }
    },
    directConnect: true,
    baseUrl: 'http://localhost:5000/',
    framework: 'jasmine',
    jasmineNodeOpts: {
        showColors: true,
        defaultTimeoutInterval: 30000,
        print: function () { }
    },
    onPrepare() {
        require('ts-node').register({
            project: require('path').join(__dirname, './tsconfig.e2e.json')
        });
        jasmine.getEnv().addReporter(new SpecReporter({ spec: { displayStacktrace: true } }));
    }
};
