# Implementation Guide - Critical Backend Improvements

This document outlines the critical improvements that have been implemented and provides guidance on next steps.

## ✅ Completed Implementations

### 1. Schema-Code Mismatch Fixed
**File**: `prisma/schema.prisma`

Added missing User fields that were referenced in code but didn't exist in the schema:
- `isVerified` - Email verification status
- `isSuspended` - Account suspension status
- `failedLoginAttempts` - Track failed login attempts
- `lockoutUntil` - Temporary account lockout
- `tokenVersion` - For refresh token rotation
- `lastLoginAt` - Track last login time
- `passwordChangedAt` - Track password changes

**Action Required**: Run database migration
```bash
npx prisma migrate dev --name add_user_security_fields
npx prisma generate
```

### 2. Database Indexes Added
**File**: `prisma/schema.prisma`

Added composite indexes for better query performance:
- User: `isVerified`, `isSuspended`, `tokenVersion`
- Booking: `[eventId, status]`, `[vendorId, status]`, `[createdAt, status]`
- Message: `[senderId, receiverId, createdAt]`, `[isRead, receiverId]`

**Action Required**: Included in migration above

### 3. Dangerous SQL Sanitization Removed
**File**: `src/lib/base-service.ts`

Removed manual SQL sanitization that was dangerous and unnecessary. Prisma ORM already handles SQL injection prevention via parameterized queries. Replaced with simple string trimming utility.

**No action required** - This is a code-level change

### 4. Environment Validation Implemented
**File**: `src/lib/env.ts`

Created comprehensive environment variable validation using Zod:
- Validates all required environment variables at startup
- Provides type-safe access to environment variables
- Includes helpful error messages for missing/invalid values

**Action Required**: 
1. Copy `env.example` to `.env`
2. Fill in all required values
3. Import and use `env` from `@/lib/env` instead of `process.env`
4. Call `validateEnv()` in your application entry point

```typescript
// In your main app file (e.g., src/app/layout.tsx or middleware)
import { validateEnv } from '@/lib/env';

validateEnv(); // Call this at startup
```

### 5. Transaction Management Wrapper
**File**: `src/lib/transaction.ts`

Implemented comprehensive transaction utilities:
- `withTransaction()` - Execute operations atomically
- `withRetry()` - Retry transient failures
- `batchOperation()` - Efficient bulk operations
- `withOptimisticLock()` - Prevent concurrent update conflicts

**Usage Example**:
```typescript
import { withTransaction } from '@/lib/transaction';

// Wrap multi-step operations in transactions
const result = await withTransaction(async (tx) => {
  const user = await tx.user.create({ data: userData });
  await tx.vendor.create({ data: { userId: user.id, ...vendorData } });
  return user;
});
```

### 6. Zod Schema Validation
**File**: `src/lib/validation-schemas.ts`

Created comprehensive Zod schemas for all API endpoints:
- Authentication schemas (login, register, password reset)
- User, Event, Vendor, Booking schemas
- Guest, Budget, Review, Message schemas
- AI and Admin schemas

**Usage Example**:
```typescript
import { CreateEventSchema } from '@/lib/validation-schemas';

export async function POST(request: NextRequest) {
  const body = await request.json();
  
  // Validate with Zod - throws on invalid data
  const validated = CreateEventSchema.parse(body);
  
  // Or use safe parsing
  const result = CreateEventSchema.safeParse(body);
  if (!result.success) {
    return createApiError('Validation failed', 400, result.error.issues);
  }
  
  // Use validated.data
}
```

### 7. Structured Logging with Winston
**File**: `src/lib/logger-service.ts`

Implemented professional logging system:
- Different log levels (error, warn, info, http, debug)
- Colored console output for development
- JSON file logging for production
- Specialized logging methods (auth, security, performance, etc.)

**Usage Example**:
```typescript
import Logger from '@/lib/logger-service';

// Basic logging
Logger.info('User registered successfully', { userId: user.id });
Logger.error('Database connection failed', { error: err.message });

// Specialized logging
Logger.auth('Login successful', userId);
Logger.security('Rate limit exceeded', { ip, endpoint });
Logger.performance('Query execution', duration, { query });
```

**Action Required**: Install Winston
```bash
npm install winston
```

### 8. Health Check Endpoint
**File**: `src/app/api/health/route.ts`

Created health check endpoint for load balancers and monitoring:
- Checks database connectivity
- Returns system status and metrics
- Returns 503 if unhealthy

**Test it**:
```bash
curl http://localhost:3000/api/health
```

### 9. Test Infrastructure Setup
**File**: `tests/setup.ts`

Implemented proper test setup:
- Automatic database migration before tests
- Database cleanup after each test
- Proper connection management

**Action Required**: Update `.env` with test database URL
```bash
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/ariya_test_db
```

### 10. Environment Example File
**File**: `env.example`

Created comprehensive `.env.example` with:
- All required environment variables
- Helpful comments and examples
- Security best practices

**Action Required**: Copy to `.env` and fill in values
```bash
cp env.example .env
# Edit .env with your actual values
```

---

## 🔄 Next Steps - Update Existing Code

### 1. Update Auth Service to Use Transactions
**File**: `src/lib/auth-service.ts`

```typescript
import { withTransaction } from './transaction';

static async register(input: RegisterInput): Promise<AuthResult> {
  return await withTransaction(async (tx) => {
    // Check if user exists
    const existing = await tx.user.findUnique({
      where: { email: input.email.toLowerCase() }
    });
    
    if (existing) {
      throw new Error('User already exists');
    }
    
    // Create user
    const user = await tx.user.create({
      data: {
        email: input.email.toLowerCase(),
        password: await bcrypt.hash(input.password, 12),
        name: `${input.firstName} ${input.lastName}`,
        role: input.role || 'PLANNER',
        isVerified: false,
        tokenVersion: 0,
      }
    });
    
    // Generate tokens
    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    
    return { user, accessToken, refreshToken };
  });
}
```

### 2. Update API Routes to Use Zod Validation
**File**: `src/app/api/v1/events/route.ts`

```typescript
import { CreateEventSchema } from '@/lib/validation-schemas';
import Logger from '@/lib/logger-service';

export async function POST(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Use Zod validation
    const validated = CreateEventSchema.parse(body);
    
    const event = await EventService.createEvent({
      userId: user.id,
      ...validated,
      date: new Date(validated.date),
    });
    
    Logger.business('Event created', { eventId: event.id, userId: user.id });
    
    return createApiResponse(event, 'Event created successfully', 201);
  } catch (error: unknown) {
    if (error instanceof z.ZodError) {
      Logger.warn('Event validation failed', { errors: error.issues });
      return createApiError('Validation failed', 400, error.issues);
    }
    
    Logger.error('Error creating event', { error, userId: user.id });
    return createApiError('Failed to create event', 500);
  }
}
```

### 3. Replace console.log with Logger
**Search and replace across the codebase**:

```typescript
// Before
console.log('User logged in', userId);
console.error('Error:', error);

// After
Logger.info('User logged in', { userId });
Logger.error('Error occurred', { error: error.message, stack: error.stack });
```

### 4. Update Services to Use Logger
**Example**: `src/lib/booking-service.ts`

```typescript
import Logger from './logger-service';

static async createBooking(input: CreateBookingInput) {
  try {
    const booking = await withTransaction(async (tx) => {
      // Verify event exists
      const event = await tx.event.findUnique({
        where: { id: input.eventId }
      });
      
      if (!event) {
        throw new NotFoundError('Event');
      }
      
      // Create booking
      const booking = await tx.booking.create({
        data: input
      });
      
      Logger.business('Booking created', {
        bookingId: booking.id,
        eventId: input.eventId,
        vendorId: input.vendorId,
        amount: input.amount,
      });
      
      return booking;
    });
    
    return booking;
  } catch (error) {
    Logger.error('Failed to create booking', {
      error: error instanceof Error ? error.message : 'Unknown error',
      input,
    });
    throw error;
  }
}
```

---

## 🚀 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Environment
```bash
cp env.example .env
# Edit .env with your values
```

### 3. Run Database Migrations
```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Start Development Server
```bash
npm run dev
```

### 5. Run Tests
```bash
npm test
```

---

## 📋 Checklist for Production Readiness

### Critical (Must Do Before Production)
- [ ] Implement password reset email functionality (currently TODO)
- [ ] Implement email verification functionality (currently TODO)
- [ ] Set up Redis for production rate limiting
- [ ] Configure proper SMTP for email sending
- [ ] Set up Sentry or error tracking service
- [ ] Configure proper secrets management (not in docker-compose.yml)
- [ ] Add API rate limiting middleware to all routes
- [ ] Implement proper CORS configuration
- [ ] Set up SSL/TLS certificates
- [ ] Configure database connection pooling

### High Priority (Within 1-2 Sprints)
- [ ] Write unit tests for all services (target 70%+ coverage)
- [ ] Write integration tests for API endpoints
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Implement audit logging for sensitive operations
- [ ] Add monitoring and alerting (DataDog, New Relic, etc.)
- [ ] Implement soft deletes for important data
- [ ] Add database backup strategy
- [ ] Create API documentation (auto-generate from Zod schemas)
- [ ] Implement graceful shutdown handling
- [ ] Add request ID tracking for debugging

### Medium Priority (Nice to Have)
- [ ] Implement cursor-based pagination
- [ ] Add caching layer (Redis) for read-heavy operations
- [ ] Optimize N+1 queries with DataLoader pattern
- [ ] Add JSDoc comments to all public APIs
- [ ] Refactor large service files into smaller modules
- [ ] Implement WebSocket support for real-time features
- [ ] Add E2E tests for critical user journeys
- [ ] Set up performance monitoring
- [ ] Implement feature flags
- [ ] Add API versioning deprecation strategy

---

## 🔒 Security Checklist

- [x] Remove dangerous SQL sanitization
- [x] Add environment variable validation
- [ ] Implement password reset with secure tokens
- [ ] Implement email verification with secure tokens
- [ ] Set up Redis for distributed rate limiting
- [ ] Add CSRF protection for state-changing operations
- [ ] Implement proper session management
- [ ] Add security headers (helmet.js)
- [ ] Set up WAF (Web Application Firewall)
- [ ] Implement IP whitelisting for admin endpoints
- [ ] Add request signing for sensitive operations
- [ ] Set up secrets rotation policy
- [ ] Implement 2FA for admin accounts
- [ ] Add security audit logging
- [ ] Set up intrusion detection

---

## 📚 Additional Resources

### Documentation to Create
1. **API Documentation** - Auto-generate from Zod schemas using `@asteasolutions/zod-to-openapi`
2. **Database Schema Documentation** - Use Prisma's ERD generator
3. **Deployment Guide** - Step-by-step production deployment
4. **Monitoring Guide** - How to set up and use monitoring tools
5. **Troubleshooting Guide** - Common issues and solutions

### Tools to Integrate
1. **Sentry** - Error tracking and monitoring
2. **DataDog/New Relic** - Application performance monitoring
3. **Redis** - Caching and rate limiting
4. **GitHub Actions** - CI/CD pipeline
5. **SonarQube** - Code quality analysis
6. **Dependabot** - Dependency updates and security alerts

---

## 🎯 Summary

You've successfully implemented the most critical backend improvements:

1. ✅ Fixed schema-code mismatches
2. ✅ Removed dangerous SQL sanitization
3. ✅ Added environment validation
4. ✅ Implemented transaction management
5. ✅ Created Zod validation schemas
6. ✅ Set up structured logging
7. ✅ Added health check endpoint
8. ✅ Created test infrastructure
9. ✅ Added database indexes
10. ✅ Created .env.example

**Next immediate actions**:
1. Run database migrations
2. Install Winston (`npm install winston`)
3. Copy env.example to .env and fill in values
4. Update existing code to use new utilities
5. Implement TODOs in auth-service.ts (password reset, email verification)

The codebase is now significantly more production-ready, but still requires the critical items listed above before going live.
