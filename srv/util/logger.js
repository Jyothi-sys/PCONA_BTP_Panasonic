

const winston = require('winston');
const cfLogging = require('cf-nodejs-logging-support');
const e = require('express');
const config = process.env.LOG_LEVEL
// Kowsalyaa on 12-04-2024 for Logger
module.exports = {
    logger: async function (level, message, data) {
        if (config == 'error') {
            switch (level) {
                case 'error':
                    // prints the error messages with level error and data
                    const errorLogger = winston.createLogger({
                        format: winston.format.simple(), // Set the log format
                        transports: [
                            new winston.transports.File({ filename: `ErrorLogFile.log`, level: 'error' }), // Log error messages to a separate file
                            new winston.transports.Console({ level: 'error' }) // Log error messages to console
                        ]
                    });
                    errorLogger.error(message, data);
                    break;
            };
        } else if (config == 'debug') {
            switch (level) {
                case 'debug':
                    // prints the debug messages with level debug and data
                    const debugLogger = winston.createLogger({
                        format: winston.format.simple(), // Set the log format
                        transports: [
                            new winston.transports.File({ filename: `DebugLogFile.log`, level: 'error' }), // Log error messages to a separate file
                            new winston.transports.Console({ level: 'debug' }), // Log debug messages to the console
                        ]
                    });
                    debugLogger.debug(message, data);
                    break;
                case 'error':
                    // prints the error messages with level error and data
                    const errorLogger = winston.createLogger({
                        format: winston.format.simple(), // Set the log format
                        transports: [
                            new winston.transports.File({ filename: `ErrorLogFile.log`, level: 'error' }), // Log error messages to a separate file
                            new winston.transports.Console({ level: 'error' }) // Log error messages to console
                        ]
                    });
                    errorLogger.error(message, data);
                    break;
            };
        } else if (config == 'all') {
            switch (level) {
                case 'info':
                    // prints only info messages
                    const infoLogger = winston.createLogger({
                        format: winston.format.simple(), // Set the log format
                        transports: [
                            new winston.transports.File({ filename: `InfoLogFile.log`, level: 'info' }), // Log info messages to a file
                            new winston.transports.Console({ level: 'info' }), // Log info messages to console
                        ]
                    });
                    infoLogger.info(message);
                    break;
                case 'debug':
                    // prints the debug messages with level debug and data
                    const debugLogger = winston.createLogger({
                        format: winston.format.simple(), // Set the log format
                        transports: [
                            new winston.transports.File({ filename: `DebugLogFile.log`, level: 'error' }), // Log error messages to a separate file
                            new winston.transports.Console({ level: 'debug' }), // Log debug messages to the console
                        ]
                    });
                    debugLogger.debug(message, data);
                    break;
                case 'error':
                    // prints the error messages with level error and data
                    const errorLogger = winston.createLogger({
                        format: winston.format.simple(), // Set the log format
                        transports: [
                            new winston.transports.File({ filename: `ErrorLogFile.log`, level: 'error' }), // Log error messages to a separate file
                            new winston.transports.Console({ level: 'error' }) // Log error messages to console
                        ]
                    });
                    errorLogger.error(message, data);
                    break;
            };


        }
    },
    cfLoggingMessages: async function (level, message, data) {
        if (level == 'info') {
            cfLogging.setLoggingLevel("info");
            if (data) {
                cfLogging.info(`${message} , ${data}`);
            } else {
                cfLogging.info(`${message}`);
            }
        } else if (level == 'debug') {
            cfLogging.setLoggingLevel("debug");
            if (data) {
                cfLogging.debug(`${message} , ${data}`);
            } else {
                cfLogging.debug(`${message}`);
            }
        } else if (level == 'error') {
            cfLogging.setLoggingLevel("error");
            if (data) {
                cfLogging.error(`${message} , ${data}`);
            } else {
                cfLogging.error(`${message}`);
            }
        }
    }
}

