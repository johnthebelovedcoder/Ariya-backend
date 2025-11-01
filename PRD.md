# Product Requirements Document (PRD) - Ariya Backend

## Vision Statement
Ariya is a comprehensive event planning platform that connects event planners with vendors and services to streamline the event planning process. The platform offers vendor discovery, booking management, budget tracking, guest management, and AI-powered planning assistance.

## Product Overview
Ariya Backend is a Next.js-based API that serves as the foundation for a complete event planning ecosystem. The backend provides RESTful APIs for managing events, vendors, bookings, users, and various other event planning functionalities.

## Architecture Overview
- **Framework**: Next.js 13+ (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js with JWT tokens
- **API**: RESTful APIs with OpenAPI documentation
- **Versioning**: APIs are versioned under `/api/v1/`
- **Infrastructure**: Docker-ready with environment configuration

## Core Features

### 1. Authentication & User Management
- User registration and login with email/password
- Role-based access control (Planner, Vendor, Admin)
- JWT-based authentication with refresh tokens
- Password reset and email verification
- User profiles and preferences management

### 2. Event Management
- Create, update, and manage events
- Event dashboard with comprehensive view
- Budget tracking and allocation
- Guest list management
- Task lists and checklists
- Event categories and themes

### 3. Vendor & Venue Discovery
- Vendor profiles with detailed information
- Vendor search and filtering capabilities
- Vendor categories and specializations
- Portfolio and availability management
- Featured vendor listings
- Review and rating systems

### 4. Inquiry, Quotes & Bookings
- Request quotes from vendors
- Booking management system
- Booking confirmation workflow
- Payment processing integration
- Booking status tracking (Pending, Confirmed, Cancelled, Completed)

### 5. Messaging
- In-platform messaging between planners and vendors
- Conversation threads
- Message status tracking (Read/Unread)
- Notification system

### 6. Event Website & Registry
- Customizable event websites
- Public event pages
- RSVP management
- Gift registry
- Contribution options
- Thank-you note tracking

### 7. AI Planning Assistant
- Event idea generation
- Budget estimation and allocation
- Vendor recommendations
- Cost optimization advice
- AI feedback loop

### 8. Payment & Monetization
- Payment processing (Stripe integration)
- Transaction fee management
- Vendor subscription plans (Basic, Premium)
- Featured listing purchases
- Payment history and reporting

### 9. Admin Management
- Admin dashboard
- User management
- Vendor approval workflow
- Analytics and reporting
- System configuration
- Content moderation

### 10. Utility & System Services
- File upload and management
- Location and mapping services
- Search and autocomplete
- Notification preferences
- System utilities

## Technical Specifications

### API Versioning
All API endpoints are versioned under the `/api/v1/` path to ensure backward compatibility and future scalability.

### Security
- Input validation and sanitization
- Rate limiting (5/15min for auth, 100/hr for API)
- CORS configuration with allowed origins
- JWT token security with refresh token rotation
- SQL injection prevention
- XSS protection

### Performance
- Database indexing on frequently queried fields
- Efficient query optimization
- Caching strategies for frequently accessed data
- Pagination for large datasets

### Data Models
The system includes comprehensive data models for:
- Users (Planners and Vendors)
- Events and Event Categories
- Vendors and Vendor Categories
- Bookings and Transactions
- Reviews and Ratings
- Messages and Conversations
- Event Websites and Registries

## API Endpoints

### Versioned API
All API endpoints follow the pattern: `/api/v1/[feature]`

### Examples:
- Authentication: `POST /api/v1/auth/login`
- Users: `GET /api/v1/users`, `POST /api/v1/users`, `GET /api/v1/users/{id}`
- Events: `GET /api/v1/events`, `POST /api/v1/events`
- Vendors: `GET /api/v1/vendors`, `POST /api/v1/vendors/{id}/reviews`
- Bookings: `GET /api/v1/bookings`, `POST /api/v1/bookings`

## Development Environment

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Redis (for production rate limiting)
- Docker (for containerized deployment)

### Setup
1. Environment configuration with `.env` file
2. Database migration with Prisma
3. Client generation with Prisma
4. Development server with `npm run dev`

## Quality Assurance

### Testing
- Unit tests for core business logic
- Integration tests for API endpoints
- DTO validation tests
- Error handling tests

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Comprehensive error handling
- Input validation and sanitization

## Deployment

### Docker Support
The application includes Dockerfile and docker-compose.yml for easy containerized deployment.

### Environment Variables
Comprehensive environment variable management for different deployment environments (development, staging, production).

## Future Roadmap
- WebSocket support for real-time messaging
- Advanced analytics and reporting
- Mobile app API support
- Multi-language support
- Advanced AI features
- Integration with external calendar services