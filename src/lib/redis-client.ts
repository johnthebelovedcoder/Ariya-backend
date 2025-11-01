import { createClient, RedisClientType } from 'redis';
import { env, isProduction } from './env';
import Logger from './logger-service';

/**
 * Redis client singleton for caching and rate limiting
 */

class RedisClient {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  async connect(): Promise<void> {
    // Skip Redis in development if not configured
    if (!env.REDIS_URL) {
      Logger.warn('Redis URL not configured - using in-memory fallback');
      return;
    }

    try {
      this.client = createClient({
        url: env.REDIS_URL,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              Logger.error('Redis connection failed after 10 retries');
              return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      this.client.on('error', (err) => {
        Logger.error('Redis client error', { error: err.message });
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        Logger.info('Redis client connected');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        Logger.warn('Redis client disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      Logger.info('Redis connection established');
    } catch (error) {
      Logger.error('Failed to connect to Redis', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      this.client = null;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.quit();
      this.client = null;
      this.isConnected = false;
      Logger.info('Redis connection closed');
    }
  }

  getClient(): RedisClientType | null {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected && this.client !== null;
  }

  /**
   * Get a value from Redis
   */
  async get(key: string): Promise<string | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await this.client!.get(key);
    } catch (error) {
      Logger.error('Redis GET error', { key, error });
      return null;
    }
  }

  /**
   * Set a value in Redis with optional expiration
   */
  async set(key: string, value: string, expirationSeconds?: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      if (expirationSeconds) {
        await this.client!.setEx(key, expirationSeconds, value);
      } else {
        await this.client!.set(key, value);
      }
      return true;
    } catch (error) {
      Logger.error('Redis SET error', { key, error });
      return false;
    }
  }

  /**
   * Delete a key from Redis
   */
  async del(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.del(key);
      return true;
    } catch (error) {
      Logger.error('Redis DEL error', { key, error });
      return false;
    }
  }

  /**
   * Increment a counter in Redis
   */
  async incr(key: string): Promise<number | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await this.client!.incr(key);
    } catch (error) {
      Logger.error('Redis INCR error', { key, error });
      return null;
    }
  }

  /**
   * Set expiration on a key
   */
  async expire(key: string, seconds: number): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.expire(key, seconds);
      return true;
    } catch (error) {
      Logger.error('Redis EXPIRE error', { key, error });
      return false;
    }
  }

  /**
   * Get time to live for a key
   */
  async ttl(key: string): Promise<number | null> {
    if (!this.isReady()) {
      return null;
    }

    try {
      return await this.client!.ttl(key);
    } catch (error) {
      Logger.error('Redis TTL error', { key, error });
      return null;
    }
  }

  /**
   * Check if a key exists
   */
  async exists(key: string): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      const result = await this.client!.exists(key);
      return result === 1;
    } catch (error) {
      Logger.error('Redis EXISTS error', { key, error });
      return false;
    }
  }

  /**
   * Get multiple values
   */
  async mget(keys: string[]): Promise<(string | null)[]> {
    if (!this.isReady() || keys.length === 0) {
      return keys.map(() => null);
    }

    try {
      return await this.client!.mGet(keys);
    } catch (error) {
      Logger.error('Redis MGET error', { keys, error });
      return keys.map(() => null);
    }
  }

  /**
   * Set multiple values
   */
  async mset(keyValues: Record<string, string>): Promise<boolean> {
    if (!this.isReady()) {
      return false;
    }

    try {
      await this.client!.mSet(keyValues);
      return true;
    } catch (error) {
      Logger.error('Redis MSET error', { error });
      return false;
    }
  }
}

// Export singleton instance
export const redisClient = new RedisClient();

// Initialize Redis connection
if (isProduction || env.REDIS_URL) {
  redisClient.connect().catch((err) => {
    Logger.error('Failed to initialize Redis', { error: err.message });
  });
}

export default redisClient;
