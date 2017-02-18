#!/usr/bin/env node
'use strict';

/* LOGGER */

const logger = require(__dirname + '/wrappers/logger');
var applicationLogger = new logger.BasicLogger();
logger.makeConsoleDirtyMonkeyPatch(applicationLogger);

/* IMPORTS */

const http = require('http');
const https = require('https');

/* SERVER APPLICATION */

var application = require(__dirname + '/modules/application');
application.logger = applicationLogger;

console.log('verbose', 'going to create and start servers...');

// common connection

console.log('verbose', 'creation: http on port ' + application.config.port + (application.config.host ? ' for host ' + application.config.host + '...' : '...'));
var server = http.createServer(application);
server.listen(application.config.port, application.config.host, function () {
    console.log('info', 'http server created on port ' + +server.address().port + ' with address ' + server.address().address + ' (' + server.address().family + ')');
});

// secure connection

if (application.config.securePort && application.config.securityData && application.config.securityData.key && application.config.securityData.cert) {
    console.log('verbose', 'creation: https on port ' + application.config.securePort + (application.config.host ? ' for host ' + application.config.host + '...' : '...'));
    var secureServer = https.createServer(application.config.securityData, application);
    secureServer.listen(application.config.securePort, application.config.host, function () {
        console.log('info', 'https server created on port ' + secureServer.address().port + ' with address ' + secureServer.address().address + ' (' + secureServer.address().family + ')');
    });
}