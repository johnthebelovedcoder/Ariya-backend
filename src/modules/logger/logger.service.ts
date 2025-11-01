import { Injectable, Logger as NestLogger } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class LoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      defaultMeta: { service: 'ariya-backend' },
      transports: [
        new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
        new winston.transports.File({ filename: 'logs/combined.log' }),
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
      ],
    });
  }

  log(message: string, meta?: any) {
    this.logger.info(message, meta);
    NestLogger.log(message, 'LoggerService', false);
  }

  error(message: string, meta?: any) {
    this.logger.error(message, meta);
    NestLogger.error(message, meta, 'LoggerService');
  }

  warn(message: string, meta?: any) {
    this.logger.warn(message, meta);
    NestLogger.warn(message, 'LoggerService');
  }

  debug(message: string, meta?: any) {
    this.logger.debug(message, meta);
    NestLogger.debug(message, 'LoggerService');
  }

  info(message: string, meta?: any) {
    this.logger.info(message, meta);
    NestLogger.log(message, 'LoggerService');
  }

  auth(message: string, userId: string, meta?: any) {
    this.logger.info(message, { ...meta, userId, type: 'auth' });
    NestLogger.log(`${message} (User: ${userId})`, 'AuthLogger');
  }

  security(message: string, meta?: any) {
    this.logger.warn(message, { ...meta, type: 'security' });
    NestLogger.warn(message, 'SecurityLogger');
  }
}