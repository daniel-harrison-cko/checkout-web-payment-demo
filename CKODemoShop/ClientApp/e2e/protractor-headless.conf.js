const defaultConfig = require('./protractor.conf');

let headlessConfig = {
    ...defaultConfig.config,
    capabilities: {
        ...defaultConfig.config.capabilities,
        chromeOptions: {
            args: ['--headless']
        }
    }
};

exports.config = headlessConfig;
