import { RateLimitResult, RateLimitConfig, RateLimitStore, RateLimitType } from '@/types/rate-limit';
import { MemoryStore } from './memory-store';
import { RedisStore } from './redis-store';
import Logger from '@/lib/logger-service';
import redisClient from '@/lib/redis/client';

export class RateLimitService {
  private store: RateLimitStore = new MemoryStore(); // Initialize with MemoryStore as fallback
  private static instance: RateLimitService;
  private storePromise: Promise<RateLimitStore>;

  private constructor() {
    this.storePromise = this.initializeStore();
  }

  public static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  private async initializeStore(): Promise<RateLimitStore> {
    try {
      // Try Redis first if available
      if (await redisClient.isReady()) {
        Logger.info('Using Redis for rate limiting');
        return new RedisStore();
      }
    } catch (error) {
      Logger.warn('Falling back to in-memory rate limiting', { error });
    }

    // Fall back to in-memory store
    Logger.info('Using in-memory rate limiting');
    return new MemoryStore();
  }

  private async getStore(): Promise<RateLimitStore> {
    if (!this.store) {
      this.store = await this.storePromise;
    }
    return this.store;
  }

  public async checkLimit(
    identifier: string,
    type: RateLimitType,
    configOverride?: Partial<RateLimitConfig>
  ): Promise<RateLimitResult> {
    try {
      const store = await this.getStore();
      const config = this.getConfig(type, configOverride);
      
      const { count, resetTime } = await store.increment(identifier, config.windowMs);
      
      const remaining = Math.max(0, config.maxRequests - count);
      const resetTimestamp = resetTime || Date.now() + config.windowMs;
      
      return {
        allowed: count <= config.maxRequests,
        remaining,
        resetTime: Math.ceil((resetTimestamp - Date.now()) / 1000), // seconds until reset
        resetTimestamp
      };
    } catch (error) {
      // Fail open - don't block requests if rate limiting fails
      Logger.error('Rate limit check failed', { identifier, type, error });
      return { allowed: true };
    }
  }

  public async resetLimit(identifier: string): Promise<void> {
    try {
      const store = await this.getStore();
      await store.reset(identifier);
    } catch (error) {
      Logger.error('Failed to reset rate limit', { identifier, error });
      // Continue even if reset fails
    }
  }

  private getConfig(type: RateLimitType, override?: Partial<RateLimitConfig>): RateLimitConfig {
    // Get base config from environment or use defaults
    const baseConfig: Record<RateLimitType, RateLimitConfig> = {
      auth: {
        maxRequests: parseInt(process.env.RATE_LIMIT_AUTH_MAX ?? '5', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_AUTH_WINDOW ?? '900000', 10), // 15 minutes
        message: 'Too many login attempts. Please try again later.',
        statusCode: 429
      },
      api: {
        maxRequests: parseInt(process.env.RATE_LIMIT_API_MAX ?? '100', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_API_WINDOW ?? '3600000', 10), // 1 hour
        message: 'Too many requests. Please try again later.',
        statusCode: 429
      },
      upload: {
        maxRequests: parseInt(process.env.RATE_LIMIT_UPLOAD_MAX ?? '10', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_UPLOAD_WINDOW ?? '3600000', 10), // 1 hour
        message: 'Too many uploads. Please try again later.',
        statusCode: 429
      },
      default: {
        maxRequests: parseInt(process.env.RATE_LIMIT_DEFAULT_MAX ?? '60', 10),
        windowMs: parseInt(process.env.RATE_LIMIT_DEFAULT_WINDOW ?? '60000', 10), // 1 minute
        message: 'Too many requests. Please slow down.',
        statusCode: 429
      }
    };

    return { ...baseConfig[type], ...(override || {}) };
  }

  public async cleanup(): Promise<void> {
    try {
      const store = await this.getStore();
      if (store.cleanup) {
        await store.cleanup();
      }
    } catch (error) {
      Logger.error('Error during rate limit cleanup', { error });
    }
  }
}

export const rateLimitService = RateLimitService.getInstance();

// Clean up on process exit
process.on('beforeExit', () => rateLimitService.cleanup());
process.on('SIGINT', () => rateLimitService.cleanup());
process.on('SIGTERM', () => rateLimitService.cleanup());
