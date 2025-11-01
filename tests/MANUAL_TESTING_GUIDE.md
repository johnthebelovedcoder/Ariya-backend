# Manual QA Testing Procedures

This document provides detailed procedures for manually testing the Ariya Backend API to ensure all functionality works as expected.

## 1. Authentication & User Management

### 1.1 User Registration
**Endpoint:** `POST /api/auth/register`

**Test Cases:**

1. **Successful Registration**
   - Send valid registration data with unique email
   - Expected: HTTP 201, User object with access token
   - Verify: User exists in database, email sent

2. **Duplicate Email Registration**
   - Send registration with existing email
   - Expected: HTTP 400, Error message about existing email

3. **Invalid Email Format**
   - Send registration with invalid email format
   - Expected: HTTP 400, Validation error

4. **Weak Password**
   - Send registration with password less than 8 characters
   - Expected: HTTP 400, Validation error

5. **Missing Required Fields**
   - Send registration without required fields
   - Expected: HTTP 400, Validation error

### 1.2 User Login
**Endpoint:** `POST /api/auth/login`

**Test Cases:**

1. **Successful Login**
   - Send valid credentials
   - Expected: HTTP 200, Access token and user data

2. **Invalid Credentials**
   - Send incorrect email or password
   - Expected: HTTP 401, Error message

3. **Non-existent User**
   - Send login with non-existent email
   - Expected: HTTP 401, Error message

### 1.3 Password Reset
**Endpoints:** 
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

**Test Cases:**

1. **Forgot Password Request**
   - Send valid email
   - Expected: HTTP 200, Email sent notification

2. **Reset Password with Valid Token**
   - Use valid reset token with new password
   - Expected: HTTP 200, Success message

3. **Reset Password with Expired Token**
   - Use expired reset token
   - Expected: HTTP 400, Error message

### 1.4 User Profile Management
**Endpoints:**
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`

**Test Cases:**

1. **Get Own Profile**
   - Authenticated user gets own profile
   - Expected: HTTP 200, User data

2. **Get Other User's Profile**
   - Authenticated user gets another user's public profile
   - Expected: HTTP 200, Limited user data

3. **Update Profile**
   - Authenticated user updates own profile
   - Expected: HTTP 200, Updated user data

4. **Delete Profile**
   - Authenticated user deletes own profile
   - Expected: HTTP 200, Success message

## 2. Event Management

### 2.1 Event Creation
**Endpoint:** `POST /api/events`

**Test Cases:**

1. **Create Valid Event**
   - Send valid event data
   - Expected: HTTP 201, Event object with ID

2. **Create Event with Invalid Data**
   - Send event data with missing required fields
   - Expected: HTTP 400, Validation error

3. **Create Event with Invalid Date**
   - Send event data with past date
   - Expected: HTTP 400, Validation error

### 2.2 Event CRUD Operations
**Endpoints:**
- `GET /api/events`
- `GET /api/events/{id}`
- `PUT /api/events/{id}`
- `DELETE /api/events/{id}`

**Test Cases:**

1. **Get All Events**
   - Authenticated user gets all their events
   - Expected: HTTP 200, List of events

2. **Get Specific Event**
   - Authenticated user gets specific event
   - Expected: HTTP 200, Event data

3. **Update Event**
   - Authenticated user updates own event
   - Expected: HTTP 200, Updated event data

4. **Delete Event**
   - Authenticated user deletes own event
   - Expected: HTTP 200, Success message

### 2.3 Event Budget Management
**Endpoints:**
- `GET /api/events/{id}/budget`
- `PUT /api/events/{id}/budget`

**Test Cases:**

1. **Get Event Budget**
   - Authenticated user gets event budget
   - Expected: HTTP 200, Budget data

2. **Update Event Budget**
   - Authenticated user updates event budget
   - Expected: HTTP 200, Updated budget data

### 2.4 Event Guest Management
**Endpoints:**
- `GET /api/events/{id}/guests`
- `POST /api/events/{id}/guests`
- `PUT /api/events/{id}/guests/{guestId}`
- `DELETE /api/events/{id}/guests/{guestId}`

**Test Cases:**

1. **Add Guest**
   - Authenticated user adds guest to event
   - Expected: HTTP 200, Guest data

2. **Get Event Guests**
   - Authenticated user gets event guests
   - Expected: HTTP 200, List of guests

3. **Update Guest**
   - Authenticated user updates guest details
   - Expected: HTTP 200, Updated guest data

4. **Delete Guest**
   - Authenticated user removes guest from event
   - Expected: HTTP 200, Success message

## 3. Vendor & Venue Discovery

### 3.1 Vendor Registration
**Endpoint:** `POST /api/vendors`

**Test Cases:**

1. **Create Valid Vendor Profile**
   - Authenticated vendor creates profile
   - Expected: HTTP 201, Vendor object with ID

2. **Create Vendor Profile with Invalid Data**
   - Send vendor data with missing required fields
   - Expected: HTTP 400, Validation error

### 3.2 Vendor Search & Discovery
**Endpoint:** `GET /api/vendors`

**Test Cases:**

1. **Search All Vendors**
   - Get all vendors with pagination
   - Expected: HTTP 200, List of vendors with pagination

2. **Search Vendors by Category**
   - Filter vendors by category
   - Expected: HTTP 200, Filtered vendor list

3. **Search Vendors by Location**
   - Filter vendors by location
   - Expected: HTTP 200, Filtered vendor list

4. **Search Vendors by Rating**
   - Filter vendors by minimum rating
   - Expected: HTTP 200, Filtered vendor list

### 3.3 Vendor Profile Management
**Endpoints:**
- `GET /api/vendors/{id}`
- `PUT /api/vendors/{id}`

**Test Cases:**

1. **Get Vendor Profile**
   - Get specific vendor profile
   - Expected: HTTP 200, Vendor data

2. **Update Vendor Profile**
   - Authenticated vendor updates own profile
   - Expected: HTTP 200, Updated vendor data

### 3.4 Vendor Reviews
**Endpoints:**
- `GET /api/vendors/{id}/reviews`
- `POST /api/vendors/{id}/reviews`

**Test Cases:**

1. **Submit Vendor Review**
   - Authenticated user submits review for vendor
   - Expected: HTTP 200, Review data

2. **Get Vendor Reviews**
   - Get reviews for specific vendor
   - Expected: HTTP 200, List of reviews

## 4. Inquiry, Quotes & Bookings

### 4.1 Booking Creation
**Endpoint:** `POST /api/bookings`

**Test Cases:**

1. **Create Valid Booking**
   - Authenticated user creates booking
   - Expected: HTTP 201, Booking object with ID

2. **Create Booking with Invalid Data**
   - Send booking data with missing required fields
   - Expected: HTTP 400, Validation error

### 4.2 Booking Management
**Endpoints:**
- `GET /api/bookings`
- `GET /api/bookings/{id}`
- `PUT /api/bookings/{id}`
- `DELETE /api/bookings/{id}`

**Test Cases:**

1. **Get Bookings**
   - Authenticated user gets their bookings
   - Expected: HTTP 200, List of bookings

2. **Update Booking**
   - Authenticated user updates booking
   - Expected: HTTP 200, Updated booking data

3. **Cancel Booking**
   - Authenticated user cancels booking
   - Expected: HTTP 200, Updated booking with cancelled status

## 5. Messaging

### 5.1 Sending Messages
**Endpoint:** `POST /api/messages`

**Test Cases:**

1. **Send Valid Message**
   - Authenticated user sends message to another user
   - Expected: HTTP 200, Message object with ID

2. **Send Message with Invalid Data**
   - Send message without required fields
   - Expected: HTTP 400, Validation error

### 5.2 Message Retrieval
**Endpoints:**
- `GET /api/messages`
- `GET /api/messages/conversations`

**Test Cases:**

1. **Get Messages**
   - Authenticated user gets their messages
   - Expected: HTTP 200, List of messages

2. **Get Conversations**
   - Authenticated user gets their conversations
   - Expected: HTTP 200, List of conversations

### 5.3 Message Status Updates
**Endpoints:**
- `POST /api/messages/{id}/read`
- `GET /api/messages/unread-count`

**Test Cases:**

1. **Mark Message as Read**
   - Authenticated user marks message as read
   - Expected: HTTP 200, Updated message data

2. **Get Unread Count**
   - Authenticated user gets unread message count
   - Expected: HTTP 200, Count of unread messages

## 6. Event Website & Registry

### 6.1 Event Website Creation
**Endpoint:** `POST /api/events/{id}/website`

**Test Cases:**

1. **Create Event Website**
   - Authenticated user creates event website
   - Expected: HTTP 200, Website object

2. **Create Website with Invalid Data**
   - Send website data with invalid fields
   - Expected: HTTP 400, Validation error

### 6.2 Event Website Management
**Endpoints:**
- `GET /api/events/{id}/website`
- `PUT /api/events/{id}/website`

**Test Cases:**

1. **Get Event Website**
   - Authenticated user gets event website
   - Expected: HTTP 200, Website data

2. **Update Event Website**
   - Authenticated user updates event website
   - Expected: HTTP 200, Updated website data

### 6.3 Event Registry Creation
**Endpoint:** `POST /api/events/{id}/registry`

**Test Cases:**

1. **Create Event Registry**
   - Authenticated user creates event registry
   - Expected: HTTP 200, Registry object

2. **Create Registry with Invalid Data**
   - Send registry data with invalid fields
   - Expected: HTTP 400, Validation error

### 6.4 Registry Item Management
**Endpoints:**
- `GET /api/events/{id}/registry/items`
- `POST /api/events/{id}/registry/items`
- `PUT /api/events/{id}/registry/items/{itemId}`
- `DELETE /api/events/{id}/registry/items/{itemId}`

**Test Cases:**

1. **Add Registry Item**
   - Authenticated user adds item to registry
   - Expected: HTTP 200, Item data

2. **Get Registry Items**
   - Authenticated user gets registry items
   - Expected: HTTP 200, List of items

3. **Update Registry Item**
   - Authenticated user updates registry item
   - Expected: HTTP 200, Updated item data

4. **Delete Registry Item**
   - Authenticated user removes item from registry
   - Expected: HTTP 200, Success message

## 7. AI Planning Assistant

### 7.1 AI Recommendations
**Endpoint:** `POST /api/ai/recommendations`

**Test Cases:**

1. **Get AI Recommendations**
   - Authenticated user requests AI recommendations
   - Expected: HTTP 200, List of recommendations

2. **Get Recommendations with Invalid Data**
   - Send request with missing parameters
   - Expected: HTTP 400, Validation error

### 7.2 AI Budget Allocation
**Endpoint:** `POST /api/ai/budget-allocate`

**Test Cases:**

1. **Get AI Budget Allocation**
   - Authenticated user requests budget allocation
   - Expected: HTTP 200, Budget allocation data

2. **Get Allocation with Invalid Budget**
   - Send request with invalid budget amount
   - Expected: HTTP 400, Validation error

### 7.3 AI Budget Estimation
**Endpoint:** `POST /api/ai/budget-estimate`

**Test Cases:**

1. **Get AI Budget Estimate**
   - Authenticated user requests budget estimate
   - Expected: HTTP 200, Estimated budget data

2. **Get Estimate with Invalid Event Type**
   - Send request with unsupported event type
   - Expected: HTTP 400, Validation error

## 8. Payment & Monetization

### 8.1 Payment Processing
**Endpoint:** `POST /api/payments/process`

**Test Cases:**

1. **Process Valid Payment**
   - Authenticated user processes payment
   - Expected: HTTP 200, Payment confirmation

2. **Process Payment with Insufficient Funds**
   - Use payment method with insufficient funds
   - Expected: HTTP 400, Payment failure error

### 8.2 Payment History
**Endpoint:** `GET /api/payments`

**Test Cases:**

1. **Get Payment History**
   - Authenticated user gets payment history
   - Expected: HTTP 200, List of payments

2. **Get Payment History with Invalid Pagination**
   - Send request with invalid page/limit values
   - Expected: HTTP 400, Validation error

### 8.3 Subscription Management
**Endpoints:**
- `GET /api/subscriptions`
- `GET /api/subscriptions/plans`

**Test Cases:**

1. **Get Subscription Plans**
   - Get available subscription plans
   - Expected: HTTP 200, List of subscription plans

2. **Get User Subscriptions**
   - Authenticated user gets their subscriptions
   - Expected: HTTP 200, List of active subscriptions

## 9. Admin Management

### 9.1 Admin Dashboard
**Endpoint:** `GET /api/admin`

**Test Cases:**

1. **Get Admin Dashboard**
   - Authenticated admin gets dashboard data
   - Expected: HTTP 200, Dashboard metrics

2. **Access Dashboard as Non-Admin**
   - Non-admin user tries to access dashboard
   - Expected: HTTP 403, Permission denied error

### 9.2 Vendor Approval
**Endpoints:**
- `POST /api/admin/vendors/{id}/approve`
- `POST /api/admin/vendors/{id}/reject`

**Test Cases:**

1. **Approve Pending Vendor**
   - Admin approves pending vendor
   - Expected: HTTP 200, Approved vendor data

2. **Reject Pending Vendor**
   - Admin rejects pending vendor
   - Expected: HTTP 200, Rejected vendor data

## 10. Utility & System Services

### 10.1 File Upload
**Endpoint:** `POST /api/upload`

**Test Cases:**

1. **Upload Valid File**
   - Authenticated user uploads valid file
   - Expected: HTTP 200, File metadata

2. **Upload File Exceeding Size Limit**
   - Upload file larger than maximum allowed size
   - Expected: HTTP 400, File size error

### 10.2 Location Services
**Endpoint:** `GET /api/locations`

**Test Cases:**

1. **Search Locations**
   - Search for locations by keyword
   - Expected: HTTP 200, List of matching locations

2. **Get Nearby Locations**
   - Get locations near specified coordinates
   - Expected: HTTP 200, List of nearby locations

### 10.3 Search Functionality
**Endpoint:** `GET /api/search`

**Test Cases:**

1. **Search Content**
   - Search across events, vendors, users
   - Expected: HTTP 200, Search results with pagination

2. **Search with Invalid Query**
   - Search with empty or invalid query
   - Expected: HTTP 400, Validation error

## Test Data Preparation

### Test Users
Prepare the following test users:

1. **Planner User**
   - Role: PLANNER
   - Used for: Event creation, booking, messaging tests

2. **Vendor User**
   - Role: VENDOR
   - Used for: Vendor profile, booking response tests

3. **Admin User**
   - Role: ADMIN
   - Used for: Admin dashboard, vendor approval tests

### Test Events
Prepare the following test events:

1. **Upcoming Wedding**
   - Date: Future date
   - Status: PLANNING
   - Used for: Ongoing event management tests

2. **Completed Corporate Event**
   - Date: Past date
   - Status: COMPLETED
   - Used for: Historical data access tests

3. **Cancelled Birthday Party**
   - Date: Future date
   - Status: CANCELLED
   - Used for: Cancellation workflow tests

### Test Vendors
Prepare the following test vendors:

1. **High-Rated Caterer**
   - Category: Catering
   - Rating: 4.8+
   - Used for: Featured vendor tests

2. **New Vendor**
   - Category: Photography
   - Rating: 0 (new)
   - Used for: New vendor workflow tests

3. **Pending Vendor**
   - Category: Decor
   - Status: Pending approval
   - Used for: Admin approval workflow tests

## Test Environment Setup

### Local Development Environment
1. Ensure PostgreSQL is running
2. Ensure Redis is running (if used for caching)
3. Set up environment variables in `.env.local`
4. Run database migrations: `npx prisma migrate dev`
5. Seed test data: `npx prisma db seed`

### Test Database
1. Create separate test database
2. Set `TEST_DATABASE_URL` environment variable
3. Run tests against test database to avoid affecting development data

### API Testing Tools
Recommended tools for manual testing:

1. **Postman** - For API endpoint testing
2. **Insomnia** - Alternative to Postman
3. **curl** - Command-line HTTP client
4. **Swagger UI** - Built-in API documentation interface

## Testing Checklist

Before each release, complete this checklist:

### Authentication & User Management
- [ ] User registration with valid data
- [ ] User registration with duplicate email
- [ ] User registration with invalid data
- [ ] User login with valid credentials
- [ ] User login with invalid credentials
- [ ] Password reset workflow
- [ ] User profile retrieval
- [ ] User profile update
- [ ] User profile deletion

### Event Management
- [ ] Event creation with valid data
- [ ] Event creation with invalid data
- [ ] Event retrieval
- [ ] Event update
- [ ] Event deletion
- [ ] Event budget management
- [ ] Event guest management

### Vendor & Venue Discovery
- [ ] Vendor registration with valid data
- [ ] Vendor registration with invalid data
- [ ] Vendor search and filtering
- [ ] Vendor profile retrieval
- [ ] Vendor profile update
- [ ] Vendor review submission
- [ ] Vendor review retrieval

### Inquiry, Quotes & Bookings
- [ ] Booking creation with valid data
- [ ] Booking creation with invalid data
- [ ] Booking retrieval
- [ ] Booking update
- [ ] Booking cancellation

### Messaging
- [ ] Message sending with valid data
- [ ] Message sending with invalid data
- [ ] Message retrieval
- [ ] Conversation retrieval
- [ ] Message status updates

### Event Website & Registry
- [ ] Event website creation
- [ ] Event website update
- [ ] Event registry creation
- [ ] Registry item management
- [ ] Public event website access

### AI Planning Assistant
- [ ] AI recommendations generation
- [ ] AI budget allocation
- [ ] AI budget estimation
- [ ] AI vendor recommendations

### Payment & Monetization
- [ ] Payment processing
- [ ] Payment history retrieval
- [ ] Subscription management
- [ ] Featured listing purchase

### Admin Management
- [ ] Admin dashboard access
- [ ] Vendor approval workflow
- [ ] User management
- [ ] Analytics retrieval

### Utility & System Services
- [ ] File upload and retrieval
- [ ] Location services
- [ ] Search functionality
- [ ] Notification preferences

## Common Test Scenarios

### User Roles and Permissions
1. **Planner accessing their own data** - Should succeed
2. **Planner accessing other users' private data** - Should fail with 403
3. **Vendor accessing their own data** - Should succeed
4. **Vendor accessing admin-only endpoints** - Should fail with 403
5. **Admin accessing any user data** - Should succeed
6. **Unauthenticated user accessing protected endpoints** - Should fail with 401

### Data Validation
1. **Required field validation** - Empty required fields should return 400
2. **Email format validation** - Invalid emails should return 400
3. **Numeric field validation** - Non-numeric values should return 400
4. **Date format validation** - Invalid dates should return 400
5. **String length validation** - Too short/long strings should return 400
6. **Enum value validation** - Invalid enum values should return 400

### Error Handling
1. **Database connection errors** - Should return 500 with generic error message
2. **External service failures** - Should return 500 with graceful degradation
3. **Invalid request parameters** - Should return 400 with detailed error message
4. **Resource not found** - Should return 404 with clear message
5. **Permission denied** - Should return 403 with clear message
6. **Authentication required** - Should return 401 with clear message

### Performance Testing
1. **Response time** - API responses should return within 2 seconds
2. **Concurrent requests** - System should handle 100 concurrent requests
3. **Large payload handling** - System should handle large JSON payloads
4. **File upload limits** - Large file uploads should be rejected gracefully

### Security Testing
1. **SQL injection attempts** - Malicious SQL should be rejected
2. **XSS attempts** - Malicious scripts should be sanitized
3. **CSRF protection** - State-changing requests should require proper tokens
4. **Rate limiting** - Excessive requests should be throttled
5. **Authentication token expiration** - Expired tokens should be rejected
6. **Sensitive data exposure** - Passwords and tokens should not be logged

## Reporting Issues

When reporting issues found during testing:

1. **Clear Title** - Brief description of the issue
2. **Detailed Steps to Reproduce** - Exact sequence of actions
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happened
5. **Environment Information** - Browser, OS, API version
6. **Screenshots/Logs** - Visual evidence or error logs
7. **Severity Level** - Critical, High, Medium, Low
8. **Priority** - Immediate, High, Normal, Low

## Test Automation Recommendations

For future test automation:

1. **API Contract Testing** - Use Pact or similar tools
2. **Load Testing** - Use JMeter or k6
3. **Security Testing** - Use OWASP ZAP or Burp Suite
4. **Continuous Testing** - Integrate with CI/CD pipeline
5. **Cross-browser Testing** - Ensure compatibility across browsers
6. **Mobile Testing** - Test responsive design and mobile APIs

This comprehensive testing guide should help QA engineers thoroughly validate the Ariya Backend API functionality.