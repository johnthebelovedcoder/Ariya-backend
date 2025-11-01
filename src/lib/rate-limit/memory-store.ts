import { RateLimitStore } from '@/types/rate-limit';

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

export class MemoryStore implements RateLimitStore {
  private requests = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout;
  private cleanupIntervalMs: number;

  constructor(cleanupIntervalMs: number = 10 * 60 * 1000) { // Default: 10 minutes
    this.cleanupIntervalMs = cleanupIntervalMs;
    this.cleanupInterval = setInterval(
      () => this.cleanupExpired(),
      this.cleanupIntervalMs
    );

    // Ensure cleanup on process exit
    process.on('beforeExit', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGTERM', () => this.cleanup());
  }

  async increment(key: string, windowMs: number): Promise<{ count: number; resetTime: number }> {
    const now = Date.now();
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      const resetTime = now + windowMs;
      const newRecord: RateLimitRecord = { count: 1, resetTime };
      this.requests.set(key, newRecord);
      return { count: 1, resetTime };
    }
    
    record.count++;
    this.requests.set(key, record);
    return { count: record.count, resetTime: record.resetTime };
  }

  async reset(key: string): Promise<void> {
    this.requests.delete(key);
  }

  async cleanup(): Promise<void> {
    clearInterval(this.cleanupInterval);
    this.requests.clear();
  }

  private cleanupExpired(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now > record.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  // For testing purposes
  _getSize(): number {
    return this.requests.size;
  }
}
