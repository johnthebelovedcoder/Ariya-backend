import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/errors';

// Global error handling middleware
export function errorHandlingMiddleware(request: NextRequest, next: () => NextResponse): NextResponse {
  try {
    // Call the next middleware/route handler
    const response = next();
    
    // Log any errors if the response indicates an error
    if (response.status >= 400) {
      logError(new Error(`Response status: ${response.status}`), `Request: ${request.method} ${request.nextUrl.pathname}`);
    }
    
    return response;
  } catch (error: any) {
    // Log the error
    logError(error, `Error in middleware for ${request.method} ${request.nextUrl.pathname}`);
    
    // Return a consistent error response
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        data: null,
        errors: null,
      },
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      }
    );
  }
}