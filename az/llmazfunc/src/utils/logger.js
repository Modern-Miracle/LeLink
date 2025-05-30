/**
 * @fileoverview Logger utility for the Levea Health Bot
 * @description Provides structured logging functionality with different log levels
 * and formatting options for the application.
 */

const LOG_LEVELS = {
    ERROR: 'ERROR',
    WARN: 'WARN',
    INFO: 'INFO',
    DEBUG: 'DEBUG'
};

/**
 * Logger class for structured logging with different levels
 */
class Logger {
    constructor(options = {}) {
        this.minLevel = options.minLevel || LOG_LEVELS.DEBUG;
        this.correlationId = options.correlationId;
        this.defaultMeta = options.defaultMeta || {};
    }

    setCorrelationId(correlationId) {
        this.correlationId = correlationId;
        this.defaultMeta.correlationId = correlationId;
    }

    /**
     * Format error object for logging
     * @private
     * @param {Error} error - Error object to format
     * @returns {Object} Formatted error object
     */
    _formatError(error) {
        if (!error) return null;

        const formatted = {
            message: error.message,
            name: error.name,
            stack: error.stack
        };

        // Add custom error properties
        if (error instanceof Error) {
            if ('code' in error) formatted.code = error.code;
            if ('statusCode' in error) formatted.statusCode = error.statusCode;
            if ('operation' in error) formatted.operation = error.operation;
            if ('details' in error) formatted.details = error.details;
            if ('context' in error) formatted.context = error.context;
        }

        return formatted;
    }

    /**
     * Format log message with metadata
     * @private
     * @param {string} level - Log level
     * @param {string} message - Log message
     * @param {Object} meta - Additional metadata
     * @returns {Object} Formatted log entry
     */
    _formatLog(level, message, meta = {}) {
        const timestamp = new Date().toISOString();
        const formatted = {
            timestamp,
            level,
            message,
            ...this.defaultMeta
        };

        if (this.correlationId) {
            formatted.correlationId = this.correlationId;
        }

        // Handle errors in metadata
        if (meta.error) {
            formatted.error = this._formatError(meta.error);
            delete meta.error;
        }

        // Add remaining metadata
        if (Object.keys(meta).length > 0) {
            formatted.meta = meta;
        }

        return formatted;
    }

    /**
     * Check if level should be logged
     * @private
     * @param {string} level - Log level to check
     * @returns {boolean} Whether level should be logged
     */
    _shouldLog(level) {
        const levels = Object.values(LOG_LEVELS);
        return levels.indexOf(level) <= levels.indexOf(this.minLevel);
    }

    /**
     * Log error message
     * @param {string} message - Error message
     * @param {Object} meta - Additional metadata
     */
    error(message, meta = {}) {
        if (this._shouldLog(LOG_LEVELS.ERROR)) {
            const formatted = this._formatLog(LOG_LEVELS.ERROR, message, meta);
            console.error(JSON.stringify(formatted));
        }
    }

    /**
     * Log warning message
     * @param {string} message - Warning message
     * @param {Object} meta - Additional metadata
     */
    warn(message, meta = {}) {
        if (this._shouldLog(LOG_LEVELS.WARN)) {
            const formatted = this._formatLog(LOG_LEVELS.WARN, message, meta);
            console.warn(JSON.stringify(formatted));
        }
    }

    /**
     * Log info message
     * @param {string} message - Info message
     * @param {Object} meta - Additional metadata
     */
    info(message, meta = {}) {
        if (this._shouldLog(LOG_LEVELS.INFO)) {
            const formatted = this._formatLog(LOG_LEVELS.INFO, message, meta);
            console.info(JSON.stringify(formatted));
        }
    }

    /**
     * Log debug message
     * @param {string} message - Debug message
     * @param {Object} meta - Additional metadata
     */
    debug(message, meta = {}) {
        if (this._shouldLog(LOG_LEVELS.DEBUG)) {
            const formatted = this._formatLog(LOG_LEVELS.DEBUG, message, meta);
            console.debug(JSON.stringify(formatted));
        }
    }

    /**
     * Create child logger with additional context
     * @param {Object} options - Logger options
     * @returns {Logger} New logger instance
     */
    child(options = {}) {
        return new Logger({
            minLevel: options.minLevel || this.minLevel,
            correlationId: options.correlationId || this.correlationId,
            defaultMeta: {
                ...this.defaultMeta,
                ...options.defaultMeta
            }
        });
    }
}

module.exports = {
    Logger,
    LOG_LEVELS
}; 