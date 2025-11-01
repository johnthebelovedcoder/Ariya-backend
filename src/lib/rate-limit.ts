import { NextRequest } from 'next/server';
import Logger from './logger-service';

// Redis client will be imported dynamically to avoid circular dependencies
let redisClient: any = null;

// Try to import Redis client
(async () => {
  try {
    const redis = await import('./redis-client');
    redisClient = redis.default;
  } catch (error) {
    Logger.warn('Redis client not available, using in-memory rate limiting');
  }
})();

// Simple in-memory rate limiter (for development; use Redis in production)
class MemoryStore {
  private requests = new Map<string, { count: number; resetTime: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cleanup old records every 10 minutes
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, record] of this.requests.entries()) {
        if (now > record.resetTime) {
          this.requests.delete(key);
        }
      }
    }, 600000); // 10 minutes
  }

  increment(key: string, windowMs: number): { count: number; resetTime: number } {
    const now = Date.now();
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      this.requests.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }
    
    record.count++;
    this.requests.set(key, record);
    return record;
  }

  reset(key: string) {
    this.requests.delete(key);
  }

  close() {
    clearInterval(this.cleanupInterval);
  }
}

// Redis-based rate limiter
class RedisStore {
  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    // Check if Redis client is available and ready
    if (!redisClient || !redisClient.isReady()) {
      Logger.warn('Redis not available, using memory store fallback');
      // Fallback to memory store
      const memoryStore = new MemoryStore();
      return memoryStore.increment(key, windowMs);
    }

    try {
      const now = Date.now();
      const resetTime = now + windowMs;
      const ttlSeconds = Math.ceil(windowMs / 1000);

      // Increment counter
      const count = await redisClient.incr(key);
      
      if (count === 1) {
        // First request, set expiration
        await redisClient.expire(key, ttlSeconds);
      }

      return { count: count || 1, resetTime };
    } catch (error) {
      Logger.error('Redis rate limit error, falling back to memory', { error });
      // Fallback to memory store on error
      const memoryStore = new MemoryStore();
      return memoryStore.increment(key, windowMs);
    }
  }
}

export class RateLimitService {
  private store: MemoryStore | RedisStore;
  
  constructor() {
    // Use Redis if available, otherwise use memory store
    if (redisClient && redisClient.isReady()) {
      this.store = new RedisStore();
    } else {
      this.store = new MemoryStore();
    }
  }

  async checkLimit(identifier: string, maxRequests: number, windowMs: number): Promise<{ allowed: boolean; resetTime?: number; remaining?: number; resetTimestamp?: number }> {
    let record: { count: number; resetTime: number };
    
    if (this.store instanceof RedisStore) {
      record = await this.store.increment(identifier, windowMs);
    } else {
      record = this.store.increment(identifier, windowMs);
    }
    
    const remaining = Math.max(0, maxRequests - record.count);
    
    if (record.count > maxRequests) {
      return {
        allowed: false,
        remaining: 0,
        resetTime: record.resetTime,
        resetTimestamp: record.resetTime
      };
    }
    
    return { 
      allowed: true, 
      remaining,
      resetTimestamp: record.resetTime
    };
  }

  reset(identifier: string) {
    if (this.store instanceof MemoryStore) {
      this.store.reset(identifier);
    }
    // Redis implementation would have its own reset method
  }
}

// Rate limit configurations
const RATE_LIMITS = {
  AUTH: { maxRequests: 5, windowMs: 900000 }, // 5 attempts per 15 minutes
  API: { maxRequests: 100, windowMs: 3600000 }, // 100 requests per hour
  UPLOAD: { maxRequests: 10, windowMs: 3600000 }, // 10 uploads per hour
  DEFAULT: { maxRequests: 20, windowMs: 60000 }, // 20 requests per minute for default routes
};

export const rateLimit = {
  auth: (identifier: string) => new RateLimitService().checkLimit(
    `auth:${identifier}`, 
    RATE_LIMITS.AUTH.maxRequests, 
    RATE_LIMITS.AUTH.windowMs
  ),
  
  api: (identifier: string) => new RateLimitService().checkLimit(
    `api:${identifier}`, 
    RATE_LIMITS.API.maxRequests, 
    RATE_LIMITS.API.windowMs
  ),
  
  upload: (identifier: string) => new RateLimitService().checkLimit(
    `upload:${identifier}`, 
    RATE_LIMITS.UPLOAD.maxRequests, 
    RATE_LIMITS.UPLOAD.windowMs
  ),
  
  default: (identifier: string) => new RateLimitService().checkLimit(
    `default:${identifier}`, 
    RATE_LIMITS.DEFAULT.maxRequests, 
    RATE_LIMITS.DEFAULT.windowMs
  ),
};

// Enhanced middleware for use in API routes with response headers
export const withRateLimit = (limitFunction: (identifier: string) => Promise<any>) => {
  return async (req: NextRequest, identifier?: string) => {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               req.headers.get('x-real-ip') || 
               req.ip || 
               'unknown';
    
    const id = identifier || ip;
    const result = await limitFunction(id);
    
    return result;
  };
};

// Helper function to add rate limit headers to responses
export const addRateLimitHeaders = (response: Response, result: { allowed: boolean; remaining?: number; resetTimestamp?: number }) => {
  if (result.remaining !== undefined) {
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString());
  }
  
  if (result.resetTimestamp) {
    const resetTime = new Date(result.resetTimestamp).toUTCString();
    response.headers.set('X-RateLimit-Reset', resetTime);
    response.headers.set('Retry-After', Math.ceil((result.resetTimestamp - Date.now()) / 1000).toString());
  }
  
  return response;
};

// Rate limiting wrapper for API route handlers
export const withRateLimitHandler = (config: { maxRequests?: number; windowMs?: number; type?: 'auth' | 'api' | 'upload' | 'default' } = {}) => {
  return (handler: (req: NextRequest) => Promise<Response>) => {
    return async (req: NextRequest) => {
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                 req.headers.get('x-real-ip') || 
                 'unknown';
      
      const limitType = config.type || 'default';
      let result;
      
      switch (limitType) {
        case 'auth':
          result = await rateLimit.auth(ip);
          break;
        case 'api':
          result = await rateLimit.api(ip);
          break;
        case 'upload':
          result = await rateLimit.upload(ip);
          break;
        case 'default':
        default:
          result = await rateLimit.default(ip);
          break;
      }
      
      if (!result.allowed) {
        // Return 429 Too Many Requests
        return new Response(
          JSON.stringify({
            success: false,
            message: 'Rate limit exceeded',
            errors: [`Too many requests. Please try again later.`]
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': config.maxRequests?.toString() || RATE_LIMITS[limitType.toUpperCase() as 'AUTH' | 'API' | 'UPLOAD' | 'DEFAULT'].maxRequests.toString(),
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': new Date(result.resetTimestamp!).toUTCString(),
              'Retry-After': Math.ceil((result.resetTimestamp! - Date.now()) / 1000).toString(),
            }
          }
        );
      }
      
      // Proceed with the original handler
      const response = await handler(req);
      
      // Add rate limit headers to successful responses
      if (response.status < 400) {
        const limitConfig = config.type ? RATE_LIMITS[config.type.toUpperCase() as 'AUTH' | 'API' | 'UPLOAD' | 'DEFAULT'] : RATE_LIMITS.DEFAULT;
        response.headers.set('X-RateLimit-Limit', limitConfig.maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', result.remaining?.toString() || '');
        if (result.resetTimestamp) {
          response.headers.set('X-RateLimit-Reset', new Date(result.resetTimestamp).toUTCString());
        }
      }
      
      return response;
    };
  };
};