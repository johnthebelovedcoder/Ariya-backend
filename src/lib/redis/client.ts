import { createClient, RedisClientType } from 'redis';
import Logger from '@/lib/logger-service';

export class RedisClient {
  private static instance: RedisClient;
  private client: RedisClientType | null = null;
  private isConnected = false;
  private connectionPromise: Promise<void> | null = null;

  private constructor() {
    // Private constructor to enforce singleton
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async getClient(): Promise<RedisClientType | null> {
    if (this.isConnected && this.client) {
      return this.client;
    }

    if (this.connectionPromise) {
      await this.connectionPromise;
      return this.client;
    }

    try {
      this.connectionPromise = this.initializeClient();
      await this.connectionPromise;
      return this.client;
    } catch (error) {
      Logger.error('Failed to initialize Redis client', { error });
      return null;
    } finally {
      this.connectionPromise = null;
    }
  }

  private async initializeClient(): Promise<void> {
    if (this.isConnected && this.client) {
      return;
    }

    try {
      const url = process.env.REDIS_URL || 'redis://localhost:6379';
      this.client = createClient({ url });

      this.client.on('error', (error) => {
        Logger.error('Redis client error', { error });
        this.isConnected = false;
      });

      await this.client.connect();
      this.isConnected = true;
      Logger.info('Redis client connected successfully');
    } catch (error) {
      Logger.error('Failed to connect to Redis', { error });
      this.isConnected = false;
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.quit();
        this.isConnected = false;
        this.client = null;
        Logger.info('Redis client disconnected');
      } catch (error) {
        Logger.error('Error disconnecting Redis client', { error });
      }
    }
  }

  public isReady(): boolean {
    return this.isConnected && this.client !== null;
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  const redis = RedisClient.getInstance();
  await redis.disconnect();
  process.exit(0);
});

export default RedisClient.getInstance();
