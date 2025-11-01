import { NextResponse } from 'next/server';
import { getAuthSession } from './auth';
import { 
  AppError, 
  AuthenticationError, 
  AuthorizationError, 
  logError 
} from './errors';

// Generic API response wrapper
export const createApiResponse = (
  data: unknown = null,
  message: string = 'Success',
  statusCode: number = 200
) => {
  return NextResponse.json(
    {
      success: statusCode >= 200 && statusCode < 300,
      message,
      data,
    },
    { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
};

// Error response wrapper
export const createApiError = (
  message: string = 'An error occurred',
  statusCode: number = 400,
  errors: unknown = null
) => {
  // Sanitize error message to prevent information disclosure
  let sanitizedMessage = message;
  
  // Don't expose internal details
  if (message.toLowerCase().includes('error') && !message.toLowerCase().includes('invalid') && !message.toLowerCase().includes('not found')) {
    sanitizedMessage = 'An error occurred processing your request';
  }
  
  // Avoid exposing database or system errors
  if (message.toLowerCase().includes('database') || 
      message.toLowerCase().includes('sql') || 
      message.toLowerCase().includes('prisma') ||
      message.toLowerCase().includes('connect')) {
    sanitizedMessage = 'An error occurred processing your request';
  }
  
  return NextResponse.json(
    {
      success: false,
      message: sanitizedMessage,
      errors,
      data: null,
    },
    { 
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    }
  );
};

// Error handling wrapper for API routes
export const handleApiError = (error: unknown, context?: string) => {
  // Log the actual error for debugging purposes
  logError(error, context);
  
  if (error instanceof AppError) {
    return createApiError(error.message, error.statusCode);
  }
  
  // Handle specific error types with security in mind
  if (error instanceof Error && error.message?.includes('Authentication')) {
    return createApiError('Authentication failed', 401);
  }
  
  if (error instanceof Error && (error.message?.includes('permission') || error.message?.includes('Authorization'))) {
    return createApiError('Authorization failed', 403);
  }
  
  if (error instanceof Error && (error.message?.includes('not found') || error.message?.includes('No user found'))) {
    return createApiError('Resource not found', 404);
  }
  
  if (error instanceof Error && (error.message?.includes('already exists') || error.message?.includes('duplicate'))) {
    return createApiError('Resource already exists', 409);
  }
  
  if (error instanceof Error && error.name === 'ZodError') {
    return createApiError(`Validation error: ${error.message}`, 400);
  }
  
  // For all other errors, provide a generic message to avoid information disclosure
  return createApiError('Internal server error', 500);
};

// Global error handler function that can be used throughout the application
export class GlobalErrorHandler {
  static handle(error: unknown, context?: string): NextResponse {
    // Log error
    logError(error, context);
    
    // Return appropriate error response based on error type
    if (error instanceof AppError) {
      return createApiError(error.message, error.statusCode, error);
    }
    
    if (error instanceof Error) {
      // Sanitize error message for security
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? error.message 
        : 'An unexpected error occurred';
      
      return createApiError(errorMessage, 500);
    }
    
    return createApiError('An unexpected error occurred', 500);
  }
}

// Authentication middleware for API routes
export const requireAuthApi = async () => {
  const session = await getAuthSession();
  
  if (!session) {
    throw new AuthenticationError();
  }
  
  return { session, user: session.user };
};

// Authorization middleware for specific roles
export const requireRoleAuthApi = async (allowedRoles: string[]) => {
  const session = await getAuthSession();
  
  if (!session) {
    throw new AuthenticationError();
  }
  
  if (!session.user?.role || !allowedRoles.includes(session.user.role)) {
    throw new AuthorizationError();
  }
  
  return { session, user: session.user };
};

// Rate limiting middleware
export const withRateLimit = async (req: Request, key: string, maxRequests: number, windowMs: number) => {
  // This would typically use a shared store like Redis in production
  // For now, just returning true - the actual implementation would be in a separate service
  return true;
};

// Input sanitization helper
export const sanitizeInput = (input: any): any => {
  if (typeof input === 'string') {
    // Remove potentially dangerous characters/sequences
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+="[^"]*"/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
};