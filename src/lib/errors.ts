import { logError as structuredLogError } from './logger';

// Custom error classes for better error handling

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.name = this.constructor.name;

    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Conflict occurred') {
    super(message, 409);
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429);
  }
}

import { logError as loggerLogError } from './logger';

// Error logger utility - keeping the old function for compatibility but using new structured logger
export const logError = (error: Error, context?: string) => {
  // Use the new structured logger
  loggerLogError(error.message, context, error);
};

// Error handler utility
export const handleAsyncError = (fn: (...args: any[]) => any) => {
  return async (...args: unknown[]) => {
    try {
      return await fn(...args);
    } catch (error) {
      logError(error as Error, fn.name);
      throw error;
    }
  };
};