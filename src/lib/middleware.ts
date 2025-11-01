import { NextRequest } from 'next/server';
import { z, ZodSchema } from 'zod';
import { createApiError } from './api-utils';

// Validation middleware using Zod
export const validateRequest = (schema: ZodSchema) => {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return { success: true, data: validatedData };
    } catch (error: any) {
      // Format Zod errors for response
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, curr) => {
          const field = curr.path.join('.');
          acc[field] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        
        return { 
          success: false, 
          error: createApiError('Validation failed', 400, errors) 
        };
      }
      
      return { 
        success: false, 
        error: createApiError('Validation failed', 400) 
      };
    }
  };
};

// Query parameter validation middleware
export const validateQueryParams = (schema: ZodSchema) => {
  return (request: NextRequest) => {
    try {
      const { searchParams } = new URL(request.url);
      const params = Object.fromEntries(searchParams.entries());
      const validatedParams = schema.parse(params);
      return { success: true, data: validatedParams };
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.reduce((acc, curr) => {
          const field = curr.path.join('.');
          acc[field] = curr.message;
          return acc;
        }, {} as Record<string, string>);
        
        return { 
          success: false, 
          error: createApiError('Query parameter validation failed', 400, errors) 
        };
      }
      
      return { 
        success: false, 
        error: createApiError('Query parameter validation failed', 400) 
      };
    }
  };
};

// Rate limiting middleware (simplified version)
export const rateLimit = (maxRequests: number, windowMs: number) => {
  // In a production app, you would use a more sophisticated solution like Redis
  // This is a simplified version for demonstration
  const requests = new Map<string, { count: number; timestamp: number }>();

  return (request: NextRequest) => {
    const identifier = request.ip || 'unknown';
    const now = Date.now();
    
    if (!requests.has(identifier)) {
      requests.set(identifier, { count: 1, timestamp: now });
      return { success: true };
    }
    
    const userRequests = requests.get(identifier)!;
    
    // Reset counter if window has passed
    if (now - userRequests.timestamp > windowMs) {
      userRequests.count = 1;
      userRequests.timestamp = now;
      return { success: true };
    }
    
    // Check if user has exceeded the limit
    if (userRequests.count >= maxRequests) {
      return { 
        success: false, 
        error: createApiError('Rate limit exceeded', 429) 
      };
    }
    
    userRequests.count++;
    return { success: true };
  };
};

// Middleware to check content type
export const requireJsonContentType = (request: NextRequest) => {
  const contentType = request.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    return { 
      success: false, 
      error: createApiError('Content-Type must be application/json', 400) 
    };
  }
  
  return { success: true };
};