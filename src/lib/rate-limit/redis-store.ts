import { RateLimitStore } from '@/types/rate-limit';
import Logger from '@/lib/logger-service';
import redisClient from '@/lib/redis/client';

export class RedisStore implements RateLimitStore {
  private prefix = 'rl:';
  private scriptLoaded = false;
  private scriptSha: string | null = null;

  private getKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Load the rate limit Lua script into Redis for atomic operations
   */
  private async loadScript(): Promise<void> {
    if (this.scriptLoaded) return;

    try {
      const client = await redisClient.getClient();
      if (!client) {
        throw new Error('Redis client not available');
      }

      const script = `
        local key = KEYS[1]
        local window = tonumber(ARGV[1])
        local max = tonumber(ARGV[2])
        
        local current = redis.call("INCR", key)
        
        if current == 1 then
          redis.call("PEXPIRE", key, window)
        end
        
        local ttl = redis.call("PTTL", key)
        local reset = math.floor((ttl + (window - ttl % window)) / 1000)
        
        return {current, reset}
      `;

      const sha = await client.scriptLoad(script);
      this.scriptSha = sha;
      this.scriptLoaded = true;
    } catch (error) {
      Logger.error('Failed to load rate limit script', { error });
      throw error;
    }
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    try {
      await this.loadScript();
      const client = await redisClient.getClient();
      
      if (!client || !this.scriptSha) {
        throw new Error('Redis client or script not available');
      }

      const redisKey = this.getKey(key);
      const [count, reset] = await client.evalSha(
        this.scriptSha,
        {
          keys: [redisKey],
          arguments: [windowMs.toString(), '1']
        }
      ) as [number, number];

      return {
        count,
        resetTime: reset * 1000 // Convert to milliseconds
      };
    } catch (error) {
      Logger.error('Redis rate limit increment failed', { key, error });
      throw error;
    }
  }

  async reset(key: string): Promise<void> {
    try {
      const client = await redisClient.getClient();
      if (client) {
        await client.del(this.getKey(key));
      }
    } catch (error) {
      Logger.error('Failed to reset rate limit', { key, error });
      // Don't throw on reset failure
    }
  }

  async cleanup(): Promise<void> {
    // Redis handles key expiration automatically
  }
}
