# API Refactoring Guide - Step-by-Step Implementation

## 🎯 Goal
Transform current API endpoints into production-grade, maintainable, secure endpoints.

---

## 📦 Step 1: Create Reusable Middleware (30 minutes)

### 1.1 Create Validation Middleware

```typescript
// src/middleware/validate-request.ts
import { z } from 'zod';
import { NextRequest } from 'next/server';
import { createApiError } from '@/lib/api-utils';
import Logger from '@/lib/logger-service';

export async function validateRequest<T>(
  request: NextRequest,
  schema: z.ZodSchema<T>,
  source: 'body' | 'query' = 'body'
): Promise<T> {
  try {
    let data: unknown;
    
    if (source === 'body') {
      data = await request.json();
    } else {
      const { searchParams } = new URL(request.url);
      data = Object.fromEntries(searchParams.entries());
    }
    
    const result = schema.safeParse(data);
    
    if (!result.success) {
      Logger.warn('Validation failed', {
        errors: result.error.issues,
        data: JSON.stringify(data).substring(0, 200)
      });
      throw createApiError('Validation failed', 400, result.error.issues);
    }
    
    return result.data;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw createApiError('Invalid JSON in request body', 400);
    }
    throw error;
  }
}
```

### 1.2 Create Rate Limit Middleware

```typescript
// src/middleware/rate-limit-check.ts
import { NextRequest } from 'next/server';
import { withRateLimit } from '@/lib/rate-limit';
import { createApiError } from '@/lib/api-utils';
import Logger from '@/lib/logger-service';

export async function checkRateLimit(
  request: NextRequest,
  type: 'auth' | 'api' | 'upload' = 'api'
): Promise<void> {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const result = await withRateLimit[type](ip);
  
  if (!result.allowed) {
    Logger.security('Rate limit exceeded', {
      ip,
      type,
      resetTime: result.resetTime
    });
    
    throw createApiError(
      'Too many requests. Please try again later.',
      429,
      { retryAfter: result.resetTime }
    );
  }
}
```

### 1.3 Create Request Context Middleware

```typescript
// src/middleware/request-context.ts
import { NextRequest } from 'next/server';
import crypto from 'crypto';

export interface RequestContext {
  requestId: string;
  startTime: number;
  ip: string;
  userAgent: string;
}

export function createRequestContext(request: NextRequest): RequestContext {
  return {
    requestId: request.headers.get('x-request-id') || 
               `req_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`,
    startTime: Date.now(),
    ip: request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown'
  };
}

export function logRequestEnd(context: RequestContext, statusCode: number, userId?: string) {
  const duration = Date.now() - context.startTime;
  
  Logger.http('Request completed', {
    requestId: context.requestId,
    duration: `${duration}ms`,
    statusCode,
    ip: context.ip,
    userId
  });
}
```

### 1.4 Create Pagination Utility

```typescript
// src/lib/pagination-utils.ts
import { z } from 'zod';

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function parsePagination(searchParams: URLSearchParams): PaginationQuery {
  const result = PaginationQuerySchema.parse({
    page: searchParams.get('page'),
    limit: searchParams.get('limit'),
  });
  
  return result;
}

export function calculateOffset(page: number, limit: number): number {
  return (page - 1) * limit;
}

export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);
  
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}
```

---

## 📝 Step 2: Refactor Auth Endpoints (1 hour)

### 2.1 Refactored Login Endpoint

```typescript
// src/app/api/v1/auth/login/route.ts
import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { LoginSchema } from '@/lib/validation-schemas';
import { validateRequest } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd } from '@/middleware/request-context';
import Logger from '@/lib/logger-service';

/**
 * POST /api/v1/auth/login
 * Authenticate user and return access tokens
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  try {
    // Rate limiting
    await checkRateLimit(request, 'auth');
    
    // Validate request body
    const validated = await validateRequest(request, LoginSchema);
    
    Logger.info('Login attempt', {
      requestId: context.requestId,
      email: validated.email,
      ip: context.ip
    });
    
    // Attempt login
    const result = await AuthService.login({
      email: validated.email,
      password: validated.password,
      rememberMe: validated.rememberMe,
    });
    
    Logger.auth('Login successful', result.user.id, {
      requestId: context.requestId,
      email: validated.email
    });
    
    logRequestEnd(context, 200, result.user.id);
    
    return createApiResponse({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        isVerified: result.user.isVerified,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Login successful');
    
  } catch (error: any) {
    // Handle specific errors
    if (error.message === 'Invalid credentials') {
      Logger.warn('Login failed - invalid credentials', {
        requestId: context.requestId,
        ip: context.ip
      });
      logRequestEnd(context, 401);
      return createApiError('Invalid email or password', 401);
    }
    
    if (error.message === 'Account not verified') {
      logRequestEnd(context, 403);
      return createApiError('Please verify your email before logging in', 403);
    }
    
    if (error.message === 'Account suspended') {
      Logger.security('Login attempt on suspended account', {
        requestId: context.requestId,
        ip: context.ip
      });
      logRequestEnd(context, 403);
      return createApiError('Your account has been suspended', 403);
    }
    
    logRequestEnd(context, 500);
    return handleApiError(error, 'POST /api/v1/auth/login');
  }
}
```

### 2.2 Refactored Register Endpoint

```typescript
// src/app/api/v1/auth/register/route.ts
import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, handleApiError } from '@/lib/api-utils';
import { RegisterSchema } from '@/lib/validation-schemas';
import { validateRequest } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd } from '@/middleware/request-context';
import { withTransaction } from '@/lib/transaction';
import Logger from '@/lib/logger-service';
import prisma from '@/lib/prisma';

/**
 * POST /api/v1/auth/register
 * Register a new user account
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  try {
    // Rate limiting
    await checkRateLimit(request, 'auth');
    
    // Validate request
    const validated = await validateRequest(request, RegisterSchema);
    
    Logger.info('Registration attempt', {
      requestId: context.requestId,
      email: validated.email,
      role: validated.role,
      ip: context.ip
    });
    
    // Register user with transaction
    const result = await withTransaction(async (tx) => {
      // Create user account
      const user = await AuthService.register({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        password: validated.password,
        role: validated.role,
      });
      
      // Create vendor profile if needed
      if (validated.role === 'VENDOR' && validated.businessName) {
        await tx.vendor.create({
          data: {
            userId: user.user.id,
            businessName: validated.businessName,
            category: validated.category || '',
            description: validated.description || '',
            pricing: validated.pricing || 0,
            location: validated.location || '',
          }
        });
      }
      
      // Update user with additional fields
      if (validated.phone || validated.country) {
        await tx.user.update({
          where: { id: user.user.id },
          data: {
            phone: validated.phone,
            country: validated.country,
            currency: validated.currency,
          }
        });
      }
      
      return user;
    });
    
    Logger.business('User registered', {
      requestId: context.requestId,
      userId: result.user.id,
      email: validated.email,
      role: validated.role
    });
    
    logRequestEnd(context, 201, result.user.id);
    
    return createApiResponse({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        isVerified: result.user.isVerified,
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    }, 'Registration successful. Please check your email to verify your account.', 201);
    
  } catch (error: any) {
    if (error.message === 'User with this email already exists') {
      logRequestEnd(context, 409);
      return createApiError('A user with this email already exists', 409);
    }
    
    logRequestEnd(context, 500);
    return handleApiError(error, 'POST /api/v1/auth/register');
  }
}
```

---

## 📝 Step 3: Refactor Events Endpoint (30 minutes)

```typescript
// src/app/api/v1/events/route.ts
import { NextRequest } from 'next/server';
import { EventService } from '@/lib/event-service';
import { requireAuthApi, createApiResponse, handleApiError } from '@/lib/api-utils';
import { CreateEventSchema } from '@/lib/validation-schemas';
import { validateRequest } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd } from '@/middleware/request-context';
import { parsePagination, createPaginatedResponse } from '@/lib/pagination-utils';
import Logger from '@/lib/logger-service';

/**
 * GET /api/v1/events
 * Get all events for authenticated user with pagination
 */
export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  
  const authResult = await requireAuthApi();
  if (!('session' in authResult)) {
    logRequestEnd(context, 401);
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    await checkRateLimit(request, 'api');
    
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    
    const result = await EventService.getUserEvents(user.id, page, limit);
    
    const response = createPaginatedResponse(
      result.events,
      result.total,
      page,
      limit
    );
    
    logRequestEnd(context, 200, user.id);
    
    return createApiResponse(response, 'Events retrieved successfully');
  } catch (error: unknown) {
    Logger.error('Failed to retrieve events', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'GET /api/v1/events');
  }
}

/**
 * POST /api/v1/events
 * Create a new event
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  const authResult = await requireAuthApi();
  if (!('session' in authResult)) {
    logRequestEnd(context, 401);
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    await checkRateLimit(request, 'api');
    
    const validated = await validateRequest(request, CreateEventSchema);
    
    const event = await EventService.createEvent({
      userId: user.id,
      ...validated,
      date: new Date(validated.date),
    });
    
    Logger.business('Event created', {
      requestId: context.requestId,
      userId: user.id,
      eventId: event.id,
      eventName: event.name,
      budget: event.budget
    });
    
    logRequestEnd(context, 201, user.id);
    
    return createApiResponse(event, 'Event created successfully', 201);
  } catch (error: unknown) {
    Logger.error('Failed to create event', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'POST /api/v1/events');
  }
}
```

---

## 🔧 Step 4: Create Helper Utilities (15 minutes)

### 4.1 Response Builder

```typescript
// src/lib/response-builder.ts
import { createApiResponse } from './api-utils';
import { PaginatedResponse } from './pagination-utils';

export class ResponseBuilder {
  static success<T>(data: T, message = 'Success') {
    return createApiResponse(data, message, 200);
  }
  
  static created<T>(data: T, message = 'Resource created successfully') {
    return createApiResponse(data, message, 201);
  }
  
  static noContent(message = 'Operation completed successfully') {
    return createApiResponse(null, message, 204);
  }
  
  static paginated<T>(response: PaginatedResponse<T>, message = 'Resources retrieved successfully') {
    return createApiResponse(response, message, 200);
  }
}
```

### 4.2 Cache Helper

```typescript
// src/lib/cache-helper.ts
import redisClient from './redis-client';
import Logger from './logger-service';

export async function getCached<T>(
  key: string,
  fallback: () => Promise<T>,
  ttlSeconds: number = 300
): Promise<T> {
  try {
    // Try cache first
    const cached = await redisClient.get(key);
    if (cached) {
      Logger.debug('Cache hit', { key });
      return JSON.parse(cached);
    }
    
    // Cache miss - fetch data
    Logger.debug('Cache miss', { key });
    const data = await fallback();
    
    // Store in cache
    await redisClient.set(key, JSON.stringify(data), ttlSeconds);
    
    return data;
  } catch (error) {
    Logger.warn('Cache error, using fallback', {
      key,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    // On cache error, just use fallback
    return await fallback();
  }
}

export async function invalidateCache(pattern: string): Promise<void> {
  try {
    // In production, you'd use SCAN to find and delete matching keys
    Logger.info('Cache invalidated', { pattern });
  } catch (error) {
    Logger.error('Failed to invalidate cache', {
      pattern,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
```

---

## ✅ Testing Your Refactored Endpoints

### Test Script

```bash
# Test login with validation
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#"
  }'

# Test with invalid data (should return Zod validation errors)
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalid-email",
    "password": "123"
  }'

# Test rate limiting (run multiple times quickly)
for i in {1..10}; do
  curl -X POST http://localhost:3000/api/v1/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"wrong"}'
done

# Test pagination
curl "http://localhost:3000/api/v1/events?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Checklist for Each Endpoint

When refactoring an endpoint, ensure:

- [ ] Uses Zod schema validation
- [ ] Has rate limiting
- [ ] Uses structured logging (Logger)
- [ ] Has request context tracking
- [ ] Uses transactions for multi-step operations
- [ ] Has proper error handling
- [ ] Returns consistent response format
- [ ] Has pagination (for list endpoints)
- [ ] Logs business events
- [ ] Has JSDoc documentation

---

## 🎯 Next Steps

1. **Start with auth endpoints** (highest priority)
2. **Move to events and vendors** (most used)
3. **Then bookings and AI endpoints**
4. **Finally admin endpoints**

Refactor 2-3 endpoints per day to avoid overwhelming changes.

---

**Estimated Total Time:** 2-3 weeks for all endpoints
