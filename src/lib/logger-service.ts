import winston from 'winston';
import { env, isDevelopment, isProduction } from './env';

/**
 * Structured logging service using Winston
 * Provides consistent logging across the application with different log levels
 */

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

// Tell winston about our colors
winston.addColors(colors);

// Define format for console output (development)
const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.colorize({ all: true }),
  winston.format.printf((info) => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? `\n${JSON.stringify(meta, null, 2)}` : '';
    return `[${timestamp}] ${level}: ${message}${metaString}`;
  })
);

// Define format for file output (production)
const fileFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create transports array
const transports: winston.transport[] = [];

// Console transport (always enabled in development)
if (isDevelopment) {
  transports.push(
    new winston.transports.Console({
      format: consoleFormat,
    })
  );
}

// File transports (always enabled in production, optional in development)
if (isProduction || process.env.ENABLE_FILE_LOGGING === 'true') {
  // Error log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // Combined log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/combined.log',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    })
  );

  // HTTP requests log file
  transports.push(
    new winston.transports.File({
      filename: 'logs/http.log',
      level: 'http',
      format: fileFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 3,
    })
  );
}

// Create the logger instance
const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  levels,
  transports,
  // Don't exit on handled exceptions
  exitOnError: false,
});

/**
 * Logger service with typed methods
 */
export class Logger {
  /**
   * Log an error message
   */
  static error(message: string, meta?: Record<string, any>): void {
    logger.error(message, meta);
  }

  /**
   * Log a warning message
   */
  static warn(message: string, meta?: Record<string, any>): void {
    logger.warn(message, meta);
  }

  /**
   * Log an info message
   */
  static info(message: string, meta?: Record<string, any>): void {
    logger.info(message, meta);
  }

  /**
   * Log an HTTP request
   */
  static http(message: string, meta?: Record<string, any>): void {
    logger.http(message, meta);
  }

  /**
   * Log a debug message
   */
  static debug(message: string, meta?: Record<string, any>): void {
    logger.debug(message, meta);
  }

  /**
   * Log database query (debug level)
   */
  static query(query: string, params?: any[], duration?: number): void {
    logger.debug('Database Query', {
      query,
      params,
      duration: duration ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log API request
   */
  static request(req: {
    method: string;
    url: string;
    ip?: string;
    userId?: string;
    statusCode?: number;
    duration?: number;
  }): void {
    logger.http('API Request', {
      method: req.method,
      url: req.url,
      ip: req.ip,
      userId: req.userId,
      statusCode: req.statusCode,
      duration: req.duration ? `${req.duration}ms` : undefined,
    });
  }

  /**
   * Log authentication event
   */
  static auth(event: string, userId?: string, meta?: Record<string, any>): void {
    logger.info(`Auth: ${event}`, {
      userId,
      ...meta,
    });
  }

  /**
   * Log security event
   */
  static security(event: string, meta?: Record<string, any>): void {
    logger.warn(`Security: ${event}`, meta);
  }

  /**
   * Log business event
   */
  static business(event: string, meta?: Record<string, any>): void {
    logger.info(`Business: ${event}`, meta);
  }

  /**
   * Log performance metric
   */
  static performance(operation: string, duration: number, meta?: Record<string, any>): void {
    logger.info(`Performance: ${operation}`, {
      duration: `${duration}ms`,
      ...meta,
    });
  }

  /**
   * Create a child logger with default metadata
   */
  static child(defaultMeta: Record<string, any>): winston.Logger {
    return logger.child(defaultMeta);
  }
}

// Export the winston logger instance for advanced use cases
export const winstonLogger = logger;

// Export default logger
export default Logger;
