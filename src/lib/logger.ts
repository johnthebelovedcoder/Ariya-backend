import { format } from 'date-fns';

// Log levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

// Log entry interface
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  meta?: Record<string, any>;
  error?: Error;
}

// Base logger class
export abstract class BaseLogger {
  protected level: LogLevel;
  
  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }
  
  abstract log(entry: LogEntry): void;
  
  debug(message: string, context?: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      this.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.DEBUG,
        message,
        context,
        meta
      });
    }
  }
  
  info(message: string, context?: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.INFO)) {
      this.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.INFO,
        message,
        context,
        meta
      });
    }
  }
  
  warn(message: string, context?: string, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.WARN)) {
      this.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.WARN,
        message,
        context,
        meta
      });
    }
  }
  
  error(message: string, context?: string, error?: Error, meta?: Record<string, any>): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      this.log({
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        message,
        context,
        error,
        meta
      });
    }
  }
  
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR];
    return levels.indexOf(level) >= levels.indexOf(this.level);
  }
}

// Console logger implementation
export class ConsoleLogger extends BaseLogger {
  log(entry: LogEntry): void {
    const logMessage = {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      context: entry.context,
      meta: entry.meta,
      ...(entry.error && { error: { name: entry.error.name, message: entry.error.message, stack: entry.error.stack } })
    };
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logMessage));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logMessage));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logMessage));
        break;
      case LogLevel.ERROR:
        console.error(JSON.stringify(logMessage));
        break;
    }
  }
}

// File logger implementation (simplified - in a real application, you'd want to use a library like winston)
export class FileLogger extends BaseLogger {
  private filePath: string;
  
  constructor(level: LogLevel = LogLevel.INFO, filePath: string = './logs/app.log') {
    super(level);
    this.filePath = filePath;
  }
  
  log(entry: LogEntry): void {
    const logMessage = {
      timestamp: entry.timestamp,
      level: entry.level,
      message: entry.message,
      context: entry.context,
      meta: entry.meta,
      ...(entry.error && { error: { name: entry.error.name, message: entry.error.message, stack: entry.error.stack } })
    };
    
    // For Next.js compatibility, we'll output JSON to console
    // In production, you'd want to integrate with a logging service like LogRocket, Sentry, etc.
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(JSON.stringify(logMessage));
        break;
      case LogLevel.INFO:
        console.info(JSON.stringify(logMessage));
        break;
      case LogLevel.WARN:
        console.warn(JSON.stringify(logMessage));
        break;
      case LogLevel.ERROR:
        console.error(JSON.stringify(logMessage));
        break;
    }
  }
}

// Main logger service
class LoggerService {
  private logger: BaseLogger;
  
  constructor() {
    const logLevel = (process.env.LOG_LEVEL as LogLevel) || LogLevel.INFO;
    const logType = process.env.LOG_TYPE || 'console'; // 'console' or 'file'
    
    if (logType === 'file') {
      this.logger = new FileLogger(logLevel, process.env.LOG_FILE_PATH || './logs/app.log');
    } else {
      this.logger = new ConsoleLogger(logLevel);
    }
  }
  
  debug(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.debug(message, context, meta);
  }
  
  info(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.info(message, context, meta);
  }
  
  warn(message: string, context?: string, meta?: Record<string, any>): void {
    this.logger.warn(message, context, meta);
  }
  
  error(message: string, context?: string, error?: Error, meta?: Record<string, any>): void {
    this.logger.error(message, context, error, meta);
  }
  
  // Method to change log level at runtime
  setLevel(level: LogLevel): void {
    if (this.logger instanceof ConsoleLogger) {
      this.logger = new ConsoleLogger(level);
    } else if (this.logger instanceof FileLogger) {
      this.logger = new FileLogger(level, (this.logger as any).filePath);
    }
  }
}

// Singleton logger instance
export const logger = new LoggerService();

// Export convenience functions
export const logDebug = (message: string, context?: string, meta?: Record<string, any>) => logger.debug(message, context, meta);
export const logInfo = (message: string, context?: string, meta?: Record<string, any>) => logger.info(message, context, meta);
export const logWarn = (message: string, context?: string, meta?: Record<string, any>) => logger.warn(message, context, meta);
export const logError = (message: string, context?: string, error?: Error, meta?: Record<string, any>) => logger.error(message, context, error, meta);