# Rate Limiting Guide

## 📋 Overview
A production-ready rate limiting solution with Redis and in-memory support.

## 🚀 Quick Start

1. **Install Redis** (optional but recommended for production):
   ```bash
   # For development (Docker)
   docker run -p 6379:6379 redis
   ```

2. **Configure Environment** (`.env`):
   ```env
   # Redis (optional)
   REDIS_URL=redis://localhost:6379
   
   # Rate Limits (requests per window)
   RATE_LIMIT_AUTH=5/15m      # 5 requests per 15 minutes
   RATE_LIMIT_API=100/1h      # 100 requests per hour
   RATE_LIMIT_UPLOAD=10/1h    # 10 uploads per hour
   ```

3. **Basic Usage**:
   ```typescript
   // In your API route
   import { withRateLimit } from '@/middleware/rate-limit';
   
   export const GET = withRateLimit('api', async (request) => {
     // Your route logic
     return NextResponse.json({ data: 'Success' });
   });
   ```

## 🔧 Configuration

### Rate Limit Types
- `auth`: Stricter limits for authentication endpoints
- `api`: General API endpoints
- `upload`: File upload endpoints
- `default`: Catch-all for other endpoints

### Environment Variables
| Variable | Default | Description |
|----------|---------|-------------|
| `REDIS_URL` | - | Redis connection string |
| `RATE_LIMIT_AUTH` | 5/15m | Auth endpoint limits |
| `RATE_LIMIT_API` | 100/1h | API endpoint limits |
| `RATE_LIMIT_UPLOAD` | 10/1h | Upload endpoint limits |

## 🛠️ Advanced Usage

### Custom Limits
```typescript
import { rateLimitService } from '@/lib/rate-limit';

// In your middleware
const result = await rateLimitService.checkLimit(
  `custom:${userId}`, 
  'api', 
  { maxRequests: 10, windowMs: 60000 } // 10 requests/minute
);
```

### Rate Limit Headers
Responses include these headers:
- `X-RateLimit-Limit`: Max requests allowed
- `X-RateLimit-Remaining`: Requests remaining
- `X-RateLimit-Reset`: Reset timestamp
- `Retry-After`: Seconds to wait (when limited)

## 🔄 Migration from v1

1. **Update Imports**:
   ```diff
   - import { withRateLimit } from '@/lib/rate-limit';
   + import { withRateLimit } from '@/middleware/rate-limit';
   ```

2. **Update Environment**:
   ```diff
   - RATE_LIMIT_WINDOW=3600000
   - RATE_LIMIT_MAX=100
   + RATE_LIMIT_API=100/1h
   ```

## 🧪 Testing

```typescript
// In your test file
import { MemoryStore } from '@/lib/rate-limit/memory-store';

test('rate limiting works', async () => {
  const store = new MemoryStore();
  const result = await store.increment('test', 60000);
  expect(result.count).toBe(1);
});
```

## 📚 Full Documentation
For complete API reference and advanced usage, see the [source code](./src/lib/rate-limit).
