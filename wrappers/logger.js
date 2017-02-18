'use strict';

/**
 * @module logger
 * @description This module contain simple wrapper classes for multi-transport async logging library Winston.
 * @type {JSON}
 */

/* IMPORTS */

var winston = require('winston');

/* FUNCTIONS */

/**
 * @function module:logger.getDateTimeInBasicFormat
 * @returns {string}
 * @description Its simply function for getting current date-time in format: "yyyy-mm-dd hh:mm:ss".
 */
function getDateTimeInBasicFormat() {
    var date = new Date(),
        year = date.getFullYear(),
        month = (date.getMonth() + 1) < 10 ? '0' + (date.getMonth() + 1).toString() : (date.getMonth() + 1).toString(),
        day = date.getDate() < 10 ? '0' + date.getDate().toString() : date.getDate().toString(),
        hours = date.getHours() < 10 ? '0' + date.getHours().toString() : date.getHours().toString(),
        minutes = date.getMinutes() < 10 ? '0' + date.getMinutes().toString() : date.getMinutes().toString(),
        seconds = date.getSeconds() < 10 ? '0' + date.getSeconds().toString() : date.getSeconds().toString();
    return year + '-' + month + '-' + day + ' ' + hours + ':' + minutes + ':' + seconds;
}

/**
 * @function _checkApplicationForArguments
 * @param argumentsForCheck {string[]}
 * @returns {boolean}
 * @description Simple compare passed arguments with application launch arguments. Will return true on first match.
 */
function _checkApplicationForArguments(argumentsForCheck) {
    return process.argv.some(function (value) {
        return argumentsForCheck.indexOf(value) >= 0;
    });
}

/**
 * @function module:logger.isVerbose
 * @returns {boolean}
 * @description Its will return true if process launched with -v or --verbose argument.
 */
function isVerbose() {
    return _checkApplicationForArguments(['-v', '--verbose']);
}

/**
 * @function module:logger.isDebug
 * @returns {boolean}
 * @description Its will return true if process launched with -d or --debug argument.
 */
function isDebug() {
    return _checkApplicationForArguments(['-d', '--debug']);
}

/**
 * @function module:logger.makeConsoleDirtyMonkeyPatch
 * @param [logger] {Object} Its should be instance of winston.Logger or extended classes
 * @description This function will make dirty monkey patch for default console logging functions.
 */
function makeConsoleDirtyMonkeyPatch(logger) {
    if (!console._errorBeforeDirtyMonkeyPatch && !console._warnBeforeDirtyMonkeyPatch
        && !console._infoBeforeDirtyMonkeyPatch && !console._logBeforeDirtyMonkeyPatch
        && !console.verbose && !console.debug && !console.silly) {
        if (!logger) {
            logger = new BasicLogger();
            console._logger = logger;
        }
        console._logBeforeDirtyMonkeyPatch = console.log;
        console._infoBeforeDirtyMonkeyPatch = console.info;
        console._warnBeforeDirtyMonkeyPatch = console.warn;
        console._errorBeforeDirtyMonkeyPatch = console.error;
        console.log = function (firstArgument) {
            if (logger.levels[firstArgument] >= 0) {
                logger.log.apply(logger, arguments);
            } else {
                console._logBeforeDirtyMonkeyPatch.apply(console, arguments)
            }
        };
        console.info = console.log.bind(null, 'info');
        console.warn = console.log.bind(null, 'warn');
        console.error = console.log.bind(null, 'error');
        console.verbose = console.log.bind(null, 'verbose');
        console.debug = console.log.bind(null, 'debug');
        console.silly = console.log.bind(null, 'silly');
    } else {
        throw new Error('Cannot make console dirty monkey patch! Already patched!');
    }
}

/**
 * @function module:logger.removeConsoleDirtyMonkeyPatch
 * @description This function will cancel changes what was made by makeConsoleDirtyMonkeyPatch function.
 * @see module:logger.makeConsoleDirtyMonkeyPatch
 */
function removeConsoleDirtyMonkeyPatch() {
    if (console._errorBeforeDirtyMonkeyPatch && console._warnBeforeDirtyMonkeyPatch
        && console._infoBeforeDirtyMonkeyPatch && console._logBeforeDirtyMonkeyPatch
        && console.verbose && console.debug && console.silly) {
        console.error = console._errorBeforeDirtyMonkeyPatch;
        console.warn = console._warnBeforeDirtyMonkeyPatch;
        console.info = console._infoBeforeDirtyMonkeyPatch;
        console.log = console._logBeforeDirtyMonkeyPatch;
        console.verbose = null;
        delete console.verbose;
        console.debug = null;
        delete console.debug;
        console.silly = null;
        delete console.silly;
        if (console._logger) {
            console._logger.close();
            console._logger = null;
            delete console._logger;
        }
    } else {
        throw new Error('Cannot remove console dirty monkey patch! Nothing to remove!');
    }
}

/* CLASSES */

class BasicConsoleTransport extends winston.transports.Console {
    /**
     * @extends winston.transports.Console
     * @constructor module:logger.BasicConsoleTransport
     * @param [options] {JSON} Transport class creation options
     * @param [options.timestamp=current date-time] {null|boolean|string|function} Should to set timestamp:
     * if null/undefined -> for basic timestamp format;
     * if true/false -> for default timestamp format;
     * if string -> fixed string instead timestamp;
     * if function -> handler for timestamp creation;
     * @param [options.colorize=true] {boolean} Should to colorize transport logs? (Default is true)
     */
    constructor(options) {
        if (options) {
            if (!options.timestamp && options.timestamp !== 'boolean') {
                options.timestamp = getDateTimeInBasicFormat;
            }
        } else {
            options = {
                timestamp: getDateTimeInBasicFormat
            }
        }
        if (typeof options.colorize !== 'boolean') {
            options.colorize = true;
        }
        super(options);
    }
}

class BasicLogger extends winston.Logger {
    /**
     * @extends winston.Logger
     * @constructor module:logger.BasicLogger
     * @param [options] {JSON} Logger class creation options
     * @param [options.level] {string|number} Should to set level of logging:
     * ( error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 )
     * @description Basic logger with process verbose mode detection and basic date-time format output.
     */
    constructor(options) {
        if (options) {
            if (!options.level) {
                options.level = isDebug() ? 'debug' : isVerbose() ? 'verbose' : 'info';
            }
        } else {
            options = {
                level: isDebug() ? 'debug' : isVerbose() ? 'verbose' : 'info'
            }
        }
        super(options);
        this.add(BasicConsoleTransport);
    }
}

/* EXPORTS */

module.exports = {
    getDateTimeInBasicFormat: getDateTimeInBasicFormat,
    isVerbose: isVerbose,
    isDebug: isDebug,
    makeConsoleDirtyMonkeyPatch: makeConsoleDirtyMonkeyPatch,
    removeConsoleDirtyMonkeyPatch: removeConsoleDirtyMonkeyPatch,
    BasicConsoleTransport: BasicConsoleTransport,
    BasicLogger: BasicLogger
};