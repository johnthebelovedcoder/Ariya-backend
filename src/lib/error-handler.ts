// Enhanced Error Handling System
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number, code?: string, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = isOperational;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    // Set the name of the error class
    this.name = this.constructor.name;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    const fullMessage = field ? `${field}: ${message}` : message;
    super(fullMessage, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
    this.name = 'AuthorizationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND_ERROR');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT_ERROR');
    this.name = 'ConflictError';
  }
}

export class RateLimitError extends AppError {
  constructor(message: string = 'Rate limit exceeded') {
    super(message, 429, 'RATE_LIMIT_ERROR');
    this.name = 'RateLimitError';
  }
}

export class DatabaseError extends AppError {
  constructor(message: string) {
    super(message, 500, 'DATABASE_ERROR');
    this.name = 'DatabaseError';
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, message: string) {
    super(`Error from ${service}: ${message}`, 502, 'EXTERNAL_SERVICE_ERROR');
    this.name = 'ExternalServiceError';
  }
}

// Error handler function for API routes
export function handleApiError(error: unknown, context?: string): Response {
  console.error(`Error in ${context || 'unknown context'}:`, error);

  let apiError: AppError;

  if (error instanceof AppError) {
    apiError = error;
  } else if (error instanceof Error) {
    // Convert unknown errors to generic server error
    apiError = new AppError(
      error.message || 'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  } else {
    apiError = new AppError(
      'Internal server error',
      500,
      'INTERNAL_ERROR'
    );
  }

  // Log non-operational errors (potential bugs)
  if (!apiError.isOperational) {
    console.error('Non-operational error (potential bug):', error);
  }

  // Create error response following the standard API format
  const errorResponse = {
    success: false,
    message: apiError.message,
    errors: {
      code: apiError.code || 'UNKNOWN_ERROR',
      type: apiError.name,
      ...(context && { context }),
    },
    data: null,
  };

  return new Response(JSON.stringify(errorResponse), {
    status: apiError.statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Success response helper
export function createApiResponse<T>(data: T, message: string = 'Success', status: number = 200): Response {
  const response = {
    success: true,
    message,
    data,
    errors: null,
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Error response helper
export function createApiError(message: string, statusCode: number = 400, code?: string): Response {
  const errorResponse = {
    success: false,
    message,
    data: null,
    errors: {
      code: code || 'CLIENT_ERROR',
      type: 'ApiError',
    },
  };

  return new Response(JSON.stringify(errorResponse), {
    status: statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

// Validation helper
export function validateRequestBody<T extends Record<string, unknown>>(body: T, requiredFields: string[]): ValidationError | null {
  for (const field of requiredFields) {
    if (body[field] === undefined || body[field] === null || 
        (typeof body[field] === 'string' && body[field].trim() === '')) {
      return new ValidationError(`Field "${field}" is required`, field);
    }
  }
  return null;
}