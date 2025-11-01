import { NextRequest, NextResponse } from 'next/server';
import { rateLimitService } from '@/lib/rate-limit/service';
import { RateLimitType, RateLimitConfig, RateLimitResult } from '@/types/rate-limit';
import Logger from '@/lib/logger-service';
import { createApiError } from '@/middleware/api-utils';

declare module 'next/server' {
  interface NextRequest {
    ip?: string;
  }
}

/**
 * Get client IP address from request headers
 * Checks multiple headers in order of preference
 */
function getClientIp(request: NextRequest): string {
  // Check X-Forwarded-For (most common with proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // Take the first IP in the list
    return forwardedFor.split(',')[0].trim();
  }

  // Check X-Real-IP (used by some proxies)
  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }

  // Fall back to request IP (may be the load balancer's IP in some setups)
  return request.ip || 'unknown';
}

/**
 * Add rate limit headers to the response
 */
function addRateLimitHeaders(
  response: NextResponse,
  result: { allowed: boolean; remaining?: number; resetTime?: number }
): void {
  if (result.remaining !== undefined) {
    response.headers.set('X-RateLimit-Limit', result.remaining.toString());
  }
  
  if (result.remaining !== undefined) {
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  }
  
  if (result.resetTime !== undefined) {
    const resetTimestamp = Math.ceil((Date.now() + result.resetTime * 1000) / 1000);
    response.headers.set('X-RateLimit-Reset', resetTimestamp.toString());
  }
}

/**
 * Middleware to check rate limits for a request
 * @param request The incoming request
 * @param type The type of rate limit to apply
 * @param configOverride Optional configuration override
 * @returns NextResponse with rate limit headers or error response
 */
export async function checkRateLimit(
  request: NextRequest,
  type: RateLimitType = 'api',
  configOverride?: Partial<RateLimitConfig>
): Promise<{ response?: NextResponse; result: RateLimitResult }> {
  const ip = getClientIp(request);
  const path = request.nextUrl.pathname;
  const method = request.method;
  
  // Create a unique key for this rate limit check
  const key = `${type}:${ip}:${method}:${path}`;
  
  try {
    const result = await rateLimitService.checkLimit(key, type, configOverride);
    
    const response = new NextResponse(undefined, { status: 200 });
    addRateLimitHeaders(response, result);
    
    if (!result.allowed) {
      Logger.warn('Rate limit exceeded', {
        type,
        ip,
        path,
        method,
        remaining: result.remaining,
        resetTime: result.resetTime
      });
      
      const error = createApiError(
        'Too many requests. Please try again later.',
        429,
        {
          code: 'RATE_LIMIT_EXCEEDED',
          retryAfter: result.resetTime,
          remaining: result.remaining
        }
      );
      
      return {
        response: NextResponse.json(error, { status: 429 }),
        result
      };
    }
    
    return { response, result };
  } catch (error) {
    Logger.error('Rate limit check failed', { error, ip, path, method });
    // Fail open - allow the request to proceed if rate limiting fails
    return { 
      result: { allowed: true },
      response: new NextResponse(undefined, { status: 200 })
    };
  }
}

/**
 * Higher-order function to create rate-limited route handlers
 * @param type The type of rate limit to apply
 * @param handler The route handler function
 * @returns A wrapped route handler with rate limiting
 */
export function withRateLimit(
  type: RateLimitType = 'api',
  handler: (request: NextRequest, ...args: any[]) => Promise<NextResponse>
) {
  return async function rateLimitedHandler(
    request: NextRequest,
    ...args: any[]
  ): Promise<NextResponse> {
    const { response, result } = await checkRateLimit(request, type);
    
    // If rate limit was exceeded, return the error response
    if (response && !result.allowed) {
      return response;
    }
    
    // Otherwise, proceed with the original handler
    const handlerResponse = await handler(request, ...args);
    
    // Add rate limit headers to the response
    addRateLimitHeaders(handlerResponse, result);
    
    return handlerResponse;
  };
}

/**
 * Middleware for Next.js API routes
 * @param type The type of rate limit to apply
 * @returns A middleware function
 */
export function rateLimitMiddleware(type: RateLimitType = 'api') {
  return async function middleware(request: NextRequest) {
    const { response } = await checkRateLimit(request, type);
    return response;
  };
}

// Re-export types for convenience
export type { RateLimitType, RateLimitConfig, RateLimitResult } from '@/types/rate-limit';
