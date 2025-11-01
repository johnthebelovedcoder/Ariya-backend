# Rate Limiting Module

A flexible and scalable rate limiting solution for the Ariya platform, supporting both in-memory and Redis backends.

## Features

- **Multiple Storage Backends**: In-memory (for development) and Redis (for production)
- **Multiple Rate Limit Types**: Different limits for auth, API, uploads, etc.
- **Request Tracing**: Built-in support for request context and tracing
- **Type-Safe**: Fully typed with TypeScript
- **Configurable**: Customize limits via environment variables
- **Efficient**: Uses Redis Lua scripts for atomic operations

## Usage

### Basic Usage in API Routes

```typescript
import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/middleware/rate-limit';

export async function GET(request: Request) {
  const { response } = await checkRateLimit(request, 'api');
  
  // If rate limit was exceeded, return the error response
  if (response) return response;
  
  // Your route logic here
  return NextResponse.json({ message: 'Success' });
}
```

### Using the withRateLimit Higher-Order Function

```typescript
import { withRateLimit } from '@/middleware/rate-limit';

const handler = withRateLimit('api', async (request: Request) => {
  // Your route logic here
  return NextResponse.json({ message: 'Success' });
});

export { handler as GET, handler as POST };
```

### Custom Rate Limits

```typescript
import { rateLimitService } from '@/lib/rate-limit';

// In your route handler
const result = await rateLimitService.checkLimit(
  `custom:${userId}`, 
  'api', 
  { maxRequests: 10, windowMs: 60000 } // 10 requests per minute
);
```

## Configuration

Configure rate limits via environment variables:

```env
# Redis (optional, falls back to in-memory)
REDIS_URL=redis://localhost:6379

# Rate limit configurations
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AUTH_WINDOW=900000  # 15 minutes

RATE_LIMIT_API_MAX=100
RATE_LIMIT_API_WINDOW=3600000  # 1 hour

RATE_LIMIT_UPLOAD_MAX=10
RATE_LIMIT_UPLOAD_WINDOW=3600000  # 1 hour

RATE_LIMIT_DEFAULT_MAX=60
RATE_LIMIT_DEFAULT_WINDOW=60000  # 1 minute
```

## Headers

The following headers are added to responses:

- `X-RateLimit-Limit`: Maximum number of requests allowed
- `X-RateLimit-Remaining`: Number of requests remaining
- `X-RateLimit-Reset`: Timestamp when the rate limit resets (in seconds since epoch)
- `Retry-After`: Number of seconds to wait before retrying (when rate limited)

## Error Handling

When a rate limit is exceeded, the API will return a 429 status code with the following JSON response:

```json
{
  "success": false,
  "error": {
    "message": "Too many requests. Please try again later.",
    "code": "RATE_LIMIT_EXCEEDED",
    "status": 429,
    "retryAfter": 60,
    "remaining": 0
  }
}
```

## Testing

```typescript
// In your test file
import { MemoryStore } from '@/lib/rate-limit';

describe('Rate Limiting', () => {
  let store: MemoryStore;
  
  beforeEach(() => {
    store = new MemoryStore(1000); // 1 second window for testing
  });
  
  afterEach(async () => {
    await store.cleanup();
  });
  
  test('should allow requests under limit', async () => {
    const result1 = await store.increment('test', 1000);
    expect(result1.count).toBe(1);
    
    const result2 = await store.increment('test', 1000);
    expect(result2.count).toBe(2);
  });
});
```

## Implementation Details

- Uses a sliding window algorithm for accurate rate limiting
- Automatically falls back to in-memory storage if Redis is unavailable
- Implements connection pooling for Redis to avoid connection overhead
- Includes proper cleanup on application shutdown
