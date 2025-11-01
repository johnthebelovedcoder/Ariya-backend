# API Testing Guide

This guide explains how to run and maintain tests for the Ariya Backend API.

## Prerequisites

Before running tests, make sure you have:

1. Node.js installed
2. All dependencies installed (`npm install`)
3. The application running locally (`npm run dev`)

## Running Tests

### Run All Tests

```bash
npm run test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with UI

```bash
npm run test:ui
```

### Run Tests and Generate Coverage Report

```bash
npm run test:coverage
```

## Test Categories

The tests are organized into the following categories:

1. **Authentication** - User registration, login, password reset
2. **Vendors** - Vendor profiles, categories, search, featured listings
3. **Bookings** - Booking creation, confirmation, cancellation
4. **Events** - Event creation, management, budget tracking
5. **Messaging** - User-to-user messaging, conversations, notifications
6. **Event Website & Registry** - Public event pages, RSVP, gift registries
7. **AI Planning Assistant** - AI recommendations, budget allocation, vendor suggestions
8. **Payment & Monetization** - Payment processing, subscriptions, featured listings
9. **Admin Management** - Admin dashboard, user management, analytics
10. **Utility & System Services** - File uploads, location services, search

## Manual Testing Procedures

For QA testing, follow these procedures to manually test the API:

### 1. Authentication Flow

1. **User Registration**
   - POST `/api/auth/register`
   - Test with valid and invalid data
   - Check for proper validation errors
   - Verify email uniqueness constraint

2. **User Login**
   - POST `/api/auth/login`
   - Test with correct and incorrect credentials
   - Verify JWT token generation
   - Check token expiration

3. **Password Reset**
   - POST `/api/auth/forgot-password`
   - Verify email delivery (check logs)
   - POST `/api/auth/reset-password`
   - Test with valid and expired tokens

### 2. Event Management

1. **Create Event**
   - POST `/api/events`
   - Test with all required fields
   - Verify event ownership association

2. **Manage Event Budget**
   - PUT `/api/events/{id}/budget`
   - Test budget allocation
   - Verify spending tracking

3. **Event Guest Management**
   - POST `/api/events/{id}/guests`
   - Test bulk guest addition
   - Verify RSVP tracking

### 3. Vendor Discovery

1. **Search Vendors**
   - GET `/api/vendors`
   - Test filtering by category, location, rating
   - Verify pagination

2. **Vendor Profile**
   - GET `/api/vendors/{id}`
   - Verify public profile information
   - Check portfolio images

3. **Vendor Reviews**
   - POST `/api/vendors/{id}/reviews`
   - Test review submission
   - Verify rating calculation

### 4. Booking Workflow

1. **Create Booking**
   - POST `/api/bookings`
   - Verify event-vendor association
   - Check payment status tracking

2. **Booking Confirmation**
   - PUT `/api/bookings/{id}`
   - Test status updates
   - Verify payment processing

### 5. Messaging System

1. **Send Message**
   - POST `/api/messages`
   - Test text and image messages
   - Verify delivery receipts

2. **View Conversations**
   - GET `/api/messages/conversations`
   - Check unread message counting
   - Verify conversation ordering

### 6. Event Website & Registry

1. **Create Event Website**
   - POST `/api/events/{id}/website`
   - Test customization options
   - Verify public accessibility

2. **Gift Registry**
   - POST `/api/events/{id}/registry`
   - Test item addition
   - Verify contribution tracking

### 7. AI Planning Assistant

1. **Budget Allocation**
   - POST `/api/ai/budget-allocate`
   - Test different event types
   - Verify recommendation accuracy

2. **Vendor Recommendations**
   - POST `/api/ai/recommendations`
   - Test category-specific recommendations
   - Check budget constraints

### 8. Payment Processing

1. **Process Payment**
   - POST `/api/payments/process`
   - Test different payment methods
   - Verify transaction fees

2. **Subscription Management**
   - GET `/api/subscriptions`
   - Test subscription upgrades/downgrades
   - Verify billing cycles

### 9. Admin Functions

1. **Dashboard Analytics**
   - GET `/api/admin`
   - Verify user statistics
   - Check revenue reporting

2. **Vendor Approval**
   - POST `/api/admin/vendors/{id}/approve`
   - Test approval workflow
   - Verify email notifications

### 10. Utility Services

1. **File Upload**
   - POST `/api/upload`
   - Test different file types
   - Verify storage limits

2. **Location Search**
   - GET `/api/locations`
   - Test autocomplete functionality
   - Verify geolocation accuracy

## Test Data Management

### Test Database

For testing purposes, use a separate test database:

1. Set `TEST_DATABASE_URL` environment variable
2. Run migrations on test database: `npm run migrate:test`
3. Seed test data: `npm run seed:test`

### Test Users

Create test users with different roles:

1. **Planner**: For event planning tests
2. **Vendor**: For vendor service tests
3. **Admin**: For administrative tests

### Test Cleanup

Always clean up test data after running tests:

1. Automated cleanup in test teardown
2. Manual cleanup script: `npm run cleanup:test`
3. Reset test database: `npm run reset:test`

## Troubleshooting

### Common Issues

1. **Authentication Errors**
   - Check JWT expiration settings
   - Verify user credentials
   - Ensure proper token refresh

2. **Database Connection Issues**
   - Check DATABASE_URL environment variable
   - Verify database server is running
   - Check connection pool settings

3. **Timeout Errors**
   - Increase test timeout values
   - Check external service dependencies
   - Optimize slow queries

### Debugging Tips

1. Use `console.log()` statements in tests for debugging
2. Run individual test files: `npm run test tests/auth.test.ts`
3. Use test UI for interactive debugging: `npm run test:ui`

## CI/CD Integration

The test suite integrates with CI/CD pipelines:

1. Pre-commit hooks run unit tests
2. Pull requests trigger full test suite
3. Deployment requires all tests to pass

## Contributing to Tests

When adding new tests:

1. Follow existing test patterns
2. Use descriptive test names
3. Include both positive and negative test cases
4. Mock external dependencies
5. Clean up test data in afterEach hooks