var debug = require('debug')('WoChat-Server:config');

var config;

try {
    config = require('../config');
} catch (e) {
    if (e instanceof Error && e.code === 'MODULE_NOT_FOUND') {
        config = require('../config.default');
    } else {
        throw e;
    }
}

module.exports = config;
