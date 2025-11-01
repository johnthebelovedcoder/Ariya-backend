// Core exports
export * from './service';
export * from './memory-store';
export * from './redis-store';

// Re-export types for convenience
export type { RateLimitConfig, RateLimitResult, RateLimitStore } from '@/types/rate-limit';

// Default export is the rateLimitService
export { rateLimitService as default } from './service';
