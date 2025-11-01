import { NextRequest, NextResponse } from 'next/server';
import { GlobalErrorHandler } from '@/lib/api-utils';
import { logError } from '@/lib/errors';

// Higher-order function to wrap API route handlers with error handling
export function withErrorHandler<T extends (...args: any[]) => any>(handler: T) {
  return async function wrappedHandler(...args: Parameters<T>): Promise<NextResponse | ReturnType<T>> {
    try {
      // Call the original handler
      const result = await handler(...args);
      return result;
    } catch (error: unknown) {
      // Determine the context for logging based on the arguments
      let context = 'Unknown API Route';
      
      // Try to extract context from the request parameter if available
      if (args.length > 0 && args[0] && typeof args[0] === 'object') {
        const firstArg = args[0] as { request?: NextRequest; params?: Record<string, string> };
        
        if (firstArg.request instanceof Request) {
          const url = new URL(firstArg.request.url);
          context = `${firstArg.request.method} ${url.pathname}`;
        } else if (firstArg.params) {
          // If there are no request object but we have params, try to get method from the second arg if it's a request
          if (args[1] && typeof args[1] === 'object' && args[1].request instanceof Request) {
            const url = new URL(args[1].request.url);
            context = `${args[1].request.method} ${url.pathname}`;
          }
        }
      }
      
      // Use the global error handler
      return GlobalErrorHandler.handle(error, context);
    }
  };
}

// Error boundary for API routes that catches errors in the request/response cycle
export class ApiErrorBoundary {
  static execute<T>(fn: () => T, context?: string): T {
    try {
      return fn();
    } catch (error) {
      // Log the error with context
      logError(error as Error, context || 'API Error Boundary');
      
      // Re-throw the error to be handled by the wrapper
      throw error;
    }
  }
}