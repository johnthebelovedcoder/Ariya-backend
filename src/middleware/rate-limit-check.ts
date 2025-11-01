import { NextRequest } from 'next/server';
import { rateLimit as rateLimiters } from '@/lib/rate-limit';
import { createApiError } from '@/lib/api-utils';
import Logger from '@/lib/logger-service';

/**
 * Check rate limit for incoming request
 * Throws error if rate limit exceeded
 */
export async function checkRateLimit(
  request: NextRequest,
  type: 'auth' | 'api' | 'upload' = 'api'
): Promise<void> {
  const ip = getClientIp(request);
  
  const result = await rateLimiters[type](ip);
  
  if (!result.allowed) {
    Logger.security('Rate limit exceeded', {
      ip,
      type,
      resetTime: result.resetTime,
      url: request.url,
      method: request.method
    });
    
    throw createApiError(
      'Too many requests. Please try again later.',
      429,
      { 
        retryAfter: result.resetTime,
        remaining: result.remaining || 0
      }
    );
  }
}

/**
 * Get client IP address from request headers
 * Checks multiple headers in order of preference
 */
export function getClientIp(request: NextRequest): string {
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
  
  // Check CF-Connecting-IP (Cloudflare)
  const cfIp = request.headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  
  // Fallback to unknown
  return 'unknown';
}

/**
 * Check rate limit and return result without throwing
 * Useful for custom handling
 */
export async function checkRateLimitSafe(
  request: NextRequest,
  type: 'auth' | 'api' | 'upload' = 'api'
): Promise<{ allowed: boolean; resetTime?: number; remaining?: number }> {
  const ip = getClientIp(request);
  return await rateLimiters[type](ip);
}
