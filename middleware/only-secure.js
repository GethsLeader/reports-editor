'use strict';

/**
 * Middleware for automatic redirect to https from http.
 * Using: need "onlySecure" true + valid certificate and key paths in config file.
 */

/* MIDDLEWARE */

function onlySecure(req, res, next) {
    if (this.config.onlySecure && req.protocol == 'http'
        && this.config.securePort && this.config.securityData && this.config.securityData.key && this.config.securityData.cert) {

        let url = 'https' + '://' + req.hostname
            + (this.config.securePort != 443 ? ':' + this.config.securePort.toString() : '')
            + req.url;
        res.redirect(url);
    } else {
        next();
    }
}

/* EXPORTS */

module.exports = (application) => {
    console.log('info', 'only secure connections middleware applying...');
    return onlySecure.bind(application);
};