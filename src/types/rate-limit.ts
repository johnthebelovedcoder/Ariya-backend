/**
 * Rate limiting types and interfaces
 */

export interface RateLimitResult {
  allowed: boolean;
  remaining?: number;
  resetTime?: number;
  resetTimestamp?: number;
}

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  message?: string;
  statusCode?: number;
}

export interface RateLimitStore {
  increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }>;
  reset(key: string): Promise<void>;
  cleanup?(): Promise<void>;
}

export type RateLimitType = 'auth' | 'api' | 'upload' | 'default';

export interface RateLimitHeaders {
  'X-RateLimit-Limit'?: string;
  'X-RateLimit-Remaining'?: string;
  'X-RateLimit-Reset'?: string;
  'Retry-After'?: string;
}

// Default rate limit configurations
export const DEFAULT_RATE_LIMITS: Record<RateLimitType, RateLimitConfig> = {
  auth: { 
    maxRequests: 5, 
    windowMs: 900000, // 15 minutes
    message: 'Too many login attempts. Please try again later.',
    statusCode: 429
  },
  api: { 
    maxRequests: 100, 
    windowMs: 3600000, // 1 hour
    message: 'Too many requests. Please try again later.',
    statusCode: 429
  },
  upload: { 
    maxRequests: 10, 
    windowMs: 3600000, // 1 hour
    message: 'Too many uploads. Please try again later.',
    statusCode: 429
  },
  default: { 
    maxRequests: 60, 
    windowMs: 60000, // 1 minute
    message: 'Too many requests. Please slow down.',
    statusCode: 429
  }
};
