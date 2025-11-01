# API Documentation

## Versioning
All API endpoints are versioned under the `/api/v1/` path. For example:
- Instead of `/api/users`, use `/api/v1/users`
- Instead of `/api/events`, use `/api/v1/events`
- Instead of `/api/vendors`, use `/api/v1/vendors`

## Authentication
Most endpoints require authentication using a Bearer token:
```
Authorization: Bearer <your-jwt-token>
```

## Available Endpoints

### Authentication & User Management
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/logout` - User logout
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password
- `POST /api/v1/auth/refresh-token` - Refresh authentication token
- `POST /api/v1/auth/verify-email` - Verify email
- `GET /api/v1/users` - Get all users (Admin only)
- `POST /api/v1/users` - Create a new user
- `GET /api/v1/users/{id}` - Get a specific user
- `PUT /api/v1/users/{id}` - Update a specific user
- `DELETE /api/v1/users/{id}` - Delete a specific user
- `PUT /api/v1/users/{id}/avatar` - Update user avatar
- `GET /api/v1/users/{id}/notifications` - Get user notifications
- `GET /api/v1/user/preferences` - Get user preferences
- `PUT /api/v1/user/preferences` - Update user preferences

### Event Management
- `GET /api/v1/events` - Get all events
- `POST /api/v1/events` - Create a new event
- `GET /api/v1/events/{id}` - Get a specific event
- `PUT /api/v1/events/{id}` - Update a specific event
- `DELETE /api/v1/events/{id}` - Delete a specific event
- `GET /api/v1/events/{id}/budget` - Get event budget
- `PUT /api/v1/events/{id}/budget` - Update event budget
- `GET /api/v1/events/{id}/guests` - Get event guests
- `POST /api/v1/events/{id}/guests` - Add event guest
- `GET /api/v1/events/{id}/tasks` - Get event tasks
- `POST /api/v1/events/{id}/tasks` - Create event task

### Vendor & Venue Discovery
- `GET /api/v1/vendors` - Get all vendors
- `POST /api/v1/vendors` - Create a new vendor
- `GET /api/v1/vendors/{id}` - Get a specific vendor
- `GET /api/v1/vendors/{id}/reviews` - Get vendor reviews
- `POST /api/v1/vendors/{id}/reviews` - Submit vendor review

### Inquiry, Quotes & Bookings
- `GET /api/v1/bookings` - Get bookings
- `POST /api/v1/bookings` - Create a new booking
- `GET /api/v1/bookings/{id}` - Get a specific booking
- `PUT /api/v1/bookings/{id}` - Update a specific booking
- `DELETE /api/v1/bookings/{id}` - Delete a specific booking
- `POST /api/v1/bookings/{id}/cancel` - Cancel a booking

### Messaging
- `GET /api/v1/messages` - Get user messages
- `POST /api/v1/messages` - Send a message
- `POST /api/v1/messages/{id}/read` - Mark message as read

### Utility & System Services
- `POST /api/v1/upload` - File upload
- `GET /api/v1/location/countries` - Get all countries
- `GET /api/v1/location/states/{countryCode}` - Get states for a country
- `GET /api/v1/location/cities/{stateCode}` - Get cities for a state
- `GET /api/v1/currency/rates` - Get currency exchange rates
- `POST /api/v1/currency-convert` - Convert currency

## Regionalization & Internationalization
The API supports global deployment with regional settings:

### Regional Parameters
- `country` (query/header): ISO 3166-1 alpha-2 country code (e.g., NG, US, GB)
- `currency` (query/header): ISO 4217 currency code (e.g., NGN, USD, EUR)
- `region` (query): Regional grouping (US, EU, APAC, AFRICA)
- `X-Country-Code` (header): Country code for regional routing
- `X-Currency-Code` (header): Currency code for pricing

### Supported Countries
- Nigeria (NG) - Currency: NGN (₦)
- Ghana (GH) - Currency: GHS (GH₵)
- Kenya (KE) - Currency: KES (KSh)
- Uganda (UG) - Currency: UGX (USh)
- South Africa (ZA) - Currency: ZAR (R)
- United States (US) - Currency: USD ($)
- United Kingdom (GB) - Currency: GBP (£)
- European Union (EU) - Currency: EUR (€)
- Canada (CA) - Currency: CAD (CA$)
- Australia (AU) - Currency: AUD (A$)

## Rate Limiting
All API endpoints are subject to rate limiting:
- Auth endpoints: 5 requests per 15 minutes
- API endpoints: 100 requests per hour
- Upload endpoints: 10 requests per hour

## Error Handling
API responses follow a consistent format:
```json
{
  "success": false,
  "message": "Error message",
  "data": null,
  "errors": ["Error details"]
}
```

## Request/Response Validation
All API requests are validated using DTOs (Data Transfer Objects) that enforce type safety and input validation.