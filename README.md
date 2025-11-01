# Ariya Backend

A comprehensive event planning platform backend built with Next.js, TypeScript, and Prisma ORM.

## Features

- **API Versioning**: All API endpoints are versioned under `/api/v1/`
- **Authentication**: Next-Auth with JWT tokens
- **Database**: PostgreSQL with Prisma ORM
- **Validation**: Comprehensive DTO validation and input sanitization
- **Security**: Rate limiting, CORS protection, and input sanitization
- **Logging**: Structured logging system with different log levels
- **Deployment**: Docker support for easy deployment

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Redis (for production rate limiting)

### Environment Setup

1. Copy the environment configuration:
```bash
cp .env.example .env
```

2. Update the values in `.env` with your specific configuration.

### Running in Development

1. Install dependencies:
```bash
npm install
```

2. Run database migrations:
```bash
npx prisma migrate dev
```

3. Generate Prisma client:
```bash
npx prisma generate
```

4. Run the development server:
```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

## API Documentation

API endpoints are versioned under `/api/v1/`. For example:
- Authentication: `POST /api/v1/auth/login`
- Users: `GET /api/v1/users`
- Events: `POST /api/v1/events`
- Vendors: `GET /api/v1/vendors`

### Regionalization Support
The API includes global deployment capabilities:
- Country-specific content filtering via `?country=NG` parameter
- Multi-currency support with exchange rate conversion
- Regional database routing for improved performance
- Locale-specific formatting for dates, currencies, and languages

Complete API documentation is available in [API-DOCS.md](./API-DOCS.md).

## Docker Deployment

To run with Docker:
```bash
docker-compose up -d
```

## Project Structure

```
src/
├── app/                 # Next.js app router
│   ├── api/v1/          # Versioned API routes
│   ├── docs/            # API documentation
├── lib/                 # Utility libraries and services
├── types/               # TypeScript types and DTOs
├── constants/           # Application constants
```

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:ui
```

## Learn More

To learn more about the technologies used in this project:

- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Next-Auth Documentation](https://next-auth.js.org/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
