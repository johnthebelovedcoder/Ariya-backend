# Rate Limiting Migration Guide

This guide will help you migrate from the old rate limiting implementation to the new, improved version.

## What's New

1. **Type Safety**: Full TypeScript support with proper types
2. **Better Redis Integration**: Connection pooling and proper error handling
3. **Simplified API**: Easier to use with better defaults
4. **Improved Performance**: More efficient Redis operations with Lua scripts
5. **Better Testing**: Improved testability with dependency injection

## Migration Steps

### 1. Update Dependencies

Add Redis to your project if you haven't already:

```bash
npm install redis @types/redis
```

### 2. Update Environment Variables

Update your `.env` file with the new rate limiting configuration:

```diff
# Redis Configuration
+ REDIS_URL=redis://localhost:6379

# Rate Limiting
+ RATE_LIMIT_AUTH_MAX=5
+ RATE_LIMIT_AUTH_WINDOW=900000
+ RATE_LIMIT_API_MAX=100
+ RATE_LIMIT_API_WINDOW=3600000
+ RATE_LIMIT_UPLOAD_MAX=10
+ RATE_LIMIT_UPLOAD_WINDOW=3600000
+ RATE_LIMIT_DEFAULT_MAX=60
+ RATE_LIMIT_DEFAULT_WINDOW=60000
```

### 3. Update Your Code

#### Old Way (Before)

```typescript
import { withRateLimit } from '@/lib/rate-limit';

// In your route handler
export const GET = withRateLimit('api', async (request: Request) => {
  // Your route logic
});
```

#### New Way (After)

```typescript
import { withRateLimit } from '@/middleware/rate-limit';

// In your route handler
const handler = withRateLimit('api', async (request: Request) => {
  // Your route logic
});

export { handler as GET, handler as POST };
```

### 4. Using the Rate Limit Service Directly

If you were using the rate limit service directly, update your imports and usage:

#### Old Way

```typescript
import { rateLimiters } from '@/lib/rate-limit';

// In your middleware
const result = await rateLimiters.api(ip);
```

#### New Way

```typescript
import { rateLimitService } from '@/lib/rate-limit';

// In your middleware
const result = await rateLimitService.checkLimit(`api:${ip}`, 'api');
```

### 5. Custom Rate Limits

If you had custom rate limits, update them to use the new configuration system:

#### Old Way

```typescript
const customLimiter = rateLimiters.createLimiter(10, 60000); // 10 requests per minute
```

#### New Way

```typescript
const result = await rateLimitService.checkLimit(
  `custom:${userId}`, 
  'api', 
  { maxRequests: 10, windowMs: 60000 }
);
```

## Testing Your Changes

1. Test rate limiting locally with both in-memory and Redis backends
2. Verify rate limit headers in responses
3. Test error cases (e.g., Redis connection failures)
4. Monitor application logs for any rate limiting issues

## Rollback Plan

If you need to rollback:

1. Revert your code changes
2. Remove the new environment variables
3. Restart your application

## Support

If you encounter any issues during the migration, please refer to the [documentation](./src/lib/rate-limit/README.md) or contact the development team.
