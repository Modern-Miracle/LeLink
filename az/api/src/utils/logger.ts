/**
 * @fileoverview Logger utility for the Levea Health Bot
 * @description Provides structured logging functionality with different log levels
 * and formatting options for the application.
 */

export enum LOG_LEVELS {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

export interface LogMetadata {
  [key: string]: any;
  error?: Error;
}

export interface LoggerOptions {
  minLevel?: LOG_LEVELS;
  correlationId?: string;
  defaultMeta?: Record<string, any>;
}

export interface FormattedError {
  message: string;
  name: string;
  stack?: string;
  code?: string;
  statusCode?: number;
  operation?: string;
  details?: any;
  context?: any;
}

export interface LogEntry {
  timestamp: string;
  level: LOG_LEVELS;
  message: string;
  correlationId?: string;
  error?: FormattedError;
  meta?: Record<string, any>;
  [key: string]: any;
}

/**
 * Logger class for structured logging with different levels
 */
export class Logger {
  private minLevel: LOG_LEVELS;
  private correlationId?: string;
  private defaultMeta: Record<string, any>;

  constructor(options: LoggerOptions = {}) {
    this.minLevel = options.minLevel || LOG_LEVELS.DEBUG;
    this.correlationId = options.correlationId;
    this.defaultMeta = options.defaultMeta || {};
  }

  public setCorrelationId(correlationId: string): void {
    this.correlationId = correlationId;
    this.defaultMeta.correlationId = correlationId;
  }

  /**
   * Format error object for logging
   * @private
   * @param error - Error object to format
   * @returns Formatted error object
   */
  private _formatError(error: Error): FormattedError | undefined {
    if (!error) return undefined;

    const formatted: FormattedError = {
      message: error.message,
      name: error.name,
      stack: error.stack,
    };

    // Add custom error properties
    if (error instanceof Error) {
      const errorWithCode = error as Error & {
        code?: string;
        statusCode?: number;
        operation?: string;
        details?: any;
        context?: any;
      };

      if (errorWithCode.code) formatted.code = errorWithCode.code;
      if (errorWithCode.statusCode) formatted.statusCode = errorWithCode.statusCode;
      if (errorWithCode.operation) formatted.operation = errorWithCode.operation;
      if (errorWithCode.details) formatted.details = errorWithCode.details;
      if (errorWithCode.context) formatted.context = errorWithCode.context;
    }

    return formatted;
  }

  /**
   * Format log message with metadata
   * @private
   * @param level - Log level
   * @param message - Log message
   * @param meta - Additional metadata
   * @returns Formatted log entry
   */
  private _formatLog(level: LOG_LEVELS, message: string, meta: LogMetadata = {}): LogEntry {
    const timestamp = new Date().toISOString();
    const formatted: LogEntry = {
      timestamp,
      level,
      message,
      ...this.defaultMeta,
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
   * @param level - Log level to check
   * @returns Whether level should be logged
   */
  private _shouldLog(level: LOG_LEVELS): boolean {
    const levels = Object.values(LOG_LEVELS);
    return levels.indexOf(level) <= levels.indexOf(this.minLevel);
  }

  /**
   * Log error message
   * @param message - Error message
   * @param meta - Additional metadata
   */
  public error(message: string, meta: LogMetadata = {}): void {
    if (this._shouldLog(LOG_LEVELS.ERROR)) {
      const formatted = this._formatLog(LOG_LEVELS.ERROR, message, meta);
      console.error(JSON.stringify(formatted));
    }
  }

  /**
   * Log warning message
   * @param message - Warning message
   * @param meta - Additional metadata
   */
  public warn(message: string, meta: LogMetadata = {}): void {
    if (this._shouldLog(LOG_LEVELS.WARN)) {
      const formatted = this._formatLog(LOG_LEVELS.WARN, message, meta);
      console.warn(JSON.stringify(formatted));
    }
  }

  /**
   * Log info message
   * @param message - Info message
   * @param meta - Additional metadata
   */
  public info(message: string, meta: LogMetadata = {}): void {
    if (this._shouldLog(LOG_LEVELS.INFO)) {
      const formatted = this._formatLog(LOG_LEVELS.INFO, message, meta);
      console.info(JSON.stringify(formatted));
    }
  }

  /**
   * Log debug message
   * @param message - Debug message
   * @param meta - Additional metadata
   */
  public debug(message: string, meta: LogMetadata = {}): void {
    if (this._shouldLog(LOG_LEVELS.DEBUG)) {
      const formatted = this._formatLog(LOG_LEVELS.DEBUG, message, meta);
      console.debug(JSON.stringify(formatted));
    }
  }

  /**
   * Create child logger with additional context
   * @param options - Logger options
   * @returns New logger instance
   */
  public child(options: LoggerOptions = {}): Logger {
    return new Logger({
      minLevel: options.minLevel || this.minLevel,
      correlationId: options.correlationId || this.correlationId,
      defaultMeta: {
        ...this.defaultMeta,
        ...options.defaultMeta,
      },
    });
  }
}
