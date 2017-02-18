'use strict';

/* IMPORTS */

const os = require('os');
const path = require('path');
const fs = require('fs');
const jsonfile = require('jsonfile');
const morgan = require('morgan');
const express = require('express');
const favicon = require('serve-favicon');
const multer = require('multer');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const renderEngine = require('ejs-mate');

/* EXPRESS APPLICATION */

console.log('verbose', 'express application creation...');
var application = express();

/* EXPRESS CONFIGURATION */

// default paths

application.paths = {
    node: process.argv[0],
    script: null,
    directory: null
};
application.paths.script = process.argv[1];
if (fs.statSync(application.paths.script).isDirectory()) {
    application.paths.directory = application.paths.script + (application.paths.script.lastChar != path.sep ? path.sep : '');
    application.paths.script = application.paths.script + (application.paths.script.lastChar != path.sep ? path.sep : '') + 'index.js';
} else {
    application.paths.directory = path.dirname(application.paths.script) + path.sep || __dirname;
}
application.set('path', application.paths.directory);
application.set('uploads path', os.tmpdir());
console.log('verbose', 'application path now is "%s"...', application.get('path'));
console.log('verbose', 'uploads path now is "%s"...', application.get('uploads path'));

// info

let packagePath = path.join(application.get('path'), 'package.json');
let packageJSON = {};
if (fs.existsSync(packagePath)) {
    packageJSON = jsonfile.readFileSync(packagePath);
}
application.info = {
    name: packageJSON.name || 'N/A',
    version: packageJSON.version || 'N/A',
    description: packageJSON.description || 'N/A',
    author: packageJSON.author || 'N/A',
    license: packageJSON.license || 'N/A',
};
console.log('info', 'application name:', application.info.name);
console.log('info', 'application version:', application.info.version);
console.log('info', 'application description:', application.info.description);
console.log('info', 'application author:', application.info.author);
console.log('info', 'application license:', application.info.license);

// generic configuration

let configPath = path.join(application.get('path'), 'config.json');
let configJSON = {};
if (fs.existsSync(configPath)) {
    configJSON = jsonfile.readFileSync(configPath);
}
application.config = {
    host: configJSON.host,
    port: configJSON.port || '80',
    securePort: configJSON.securePort || '443',
    securityData: {
        key: configJSON.securityData && configJSON.securityData.key ? configJSON.securityData.key : null,
        cert: configJSON.securityData && configJSON.securityData.cert ? configJSON.securityData.cert : null,
        ca: configJSON.securityData && configJSON.securityData.ca ? configJSON.securityData.ca : null
    },
    onlySecure: !!configJSON.onlySecure,
    preparationCmd: configJSON.preparationCmd || 'libreoffice --headless --convert-to $0 --infilter=CSV:44,34,76,1 $1 --outdir $2',
    preparationExt: configJSON.preparationExt || 'xlsx',
    allowed2UploadTypes: configJSON.allowed2UploadTypes || ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    allowed2UploadExtensions: configJSON.allowed2UploadExtensions || ['xlsx'],
    cleanInterval: configJSON.cleanInterval || 1000 * 60 * 60,
    timeToClean: configJSON.timeToClean || 1000 * 60 * 60 * 24
};

function loadSecureDataPart(path) {
    let data = null;
    if (fs.existsSync(path)) {
        data = fs.readFileSync(path);
    }
    return data;
}

if (application.config.securityData.key) {
    application.config.securityData.key = loadSecureDataPart(application.config.securityData.key);
    if (!application.config.securityData.key) console.error('secure connection key file missing!');
}
if (application.config.securityData.cert) {
    application.config.securityData.cert = loadSecureDataPart(application.config.securityData.cert);
    if (!application.config.securityData.cert) console.error('secure connection certificate file missing!');
}
if (application.config.securityData.ca) {
    if (application.config.securityData.ca instanceof Array) {
        for (let i = 0; i < application.config.securityData.ca.length; i++) {
            application.config.securityData.ca[i] = loadSecureDataPart(application.config.securityData.ca[i]);
            if (!application.config.securityData.ca[i]) {
                console.error('secure connection certificate authority chain file missing!');
                application.config.securityData.ca = null;
                break;
            }
        }
    } else {
        application.config.securityData.ca = loadSecureDataPart(application.config.securityData.ca);
        if (!application.config.securityData.ca) console.error('secure connection certificate authority file missing!');
    }
}

// views engines configuration

console.log('verbose', 'views configuration...');
application.engine('ejs', renderEngine);
application.set('views', path.join(application.get('path'), 'views'));
application.set('view engine', 'ejs');

// icon

application.use(favicon(path.join(application.get('path'), 'public', 'favicon.ico')));

// logging

if (application.get('env') === 'development') {
    application.use(morgan('dev'));
} else {
    application.use(morgan('common'));
}

// parsers

application.uploader = multer({dest: application.get('uploads path')});
application.use(bodyParser.json());
application.use(bodyParser.urlencoded({extended: false}));
application.use(cookieParser());

// additional modules

require(path.join(application.get('path'), 'modules', 'cleaner'))(application);


// additional middleware

application.use(require(path.join(application.get('path'), 'middleware', 'only-secure'))(application));

// static content directory

application.use(express.static(path.join(application.get('path'), 'public')));

// routes

console.log('verbose', 'routes creation...');
var routes = {
    main: require(path.join(application.get('path'), 'routes', 'main'))(application)
};

// errors handlers

// catch 404 and forward to error handler
application.use((req, res, next) => {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (application.get('env') === 'development') {
    application.use((err, req, res, next) => {
        if (!err.status || [403, 500].indexOf(err.status) >= 0) {
            console.error(err);
        }
        res.status(err.status || 500);
        let app = {
            path: application.get('path'),
            env: application.get('env'),
            cmd: process.argv.join(' ')
        };
        res.render('errors/default_development', {
            message: err.message,
            error: err,
            app: app
        });
    });
}

// production error handler
// no stacktrace leaked to user
application.use((err, req, res, next) => {
    if (!err.status || [403, 500].indexOf(err.status) >= 0) {
        console.error(err);
    }
    res.status(err.status || 500);
    res.render('errors/default_production', {
        message: err.message,
        status: err.status,
        title: 'error (' + err.status + ')', layoutPath: 'layouts/default'
    });
});

/* EXPORTS */

module.exports = application;