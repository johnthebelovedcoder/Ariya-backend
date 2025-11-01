# Installation & Setup Guide

Complete step-by-step guide to get Ariya Backend running in production.

---

## 📋 Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **PostgreSQL** 15+ ([Download](https://www.postgresql.org/download/))
- **Redis** 7+ ([Download](https://redis.io/download/)) - Optional for development, required for production
- **Git** ([Download](https://git-scm.com/downloads))

---

## 🚀 Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-org/ariya-backend.git
cd ariya-backend
```

### 2. Install Dependencies

```bash
npm install

# Install additional production dependencies
npm install winston nodemailer redis @types/nodemailer
```

### 3. Set Up Environment Variables

```bash
# Copy the example environment file
cp env.example .env
```

Edit `.env` with your configuration:

```bash
# Node Environment
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/ariya_db
TEST_DATABASE_URL=postgresql://user:password@localhost:5432/ariya_test_db

# Authentication & JWT (Generate with: openssl rand -base64 32)
JWT_SECRET=your-super-secret-jwt-key-at-least-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-jwt-refresh-key-at-least-32-characters-long
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-super-secret-nextauth-key-at-least-32-characters-long

# Redis (Optional for development)
REDIS_URL=redis://localhost:6379

# Email Service (Required for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@ariya.com

# Application
PORT=3000
LOG_LEVEL=info

# File Upload
MAX_FILE_SIZE=5242880
UPLOAD_DIR=./uploads

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3001
```

### 4. Set Up PostgreSQL Database

```bash
# Create database
createdb ariya_db

# Or using psql
psql -U postgres
CREATE DATABASE ariya_db;
\q
```

### 5. Run Database Migrations

```bash
# Run all migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 6. (Optional) Seed Database

```bash
# Create a seed script if needed
npm run seed
```

### 7. Start Redis (if using)

```bash
# Using Docker
docker run -d -p 6379:6379 --name redis redis:7-alpine

# Or install locally and run
redis-server
```

### 8. Start the Application

```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The application will be available at `http://localhost:3000`

---

## 🔧 Configuration Details

### Generating Secure Secrets

Use OpenSSL to generate secure random strings:

```bash
# Generate JWT secrets
openssl rand -base64 32

# Generate multiple secrets at once
for i in {1..3}; do openssl rand -base64 32; done
```

### Email Service Setup

#### Option 1: Gmail

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password:
   - Go to Google Account → Security → 2-Step Verification → App passwords
   - Select "Mail" and "Other (Custom name)"
   - Copy the generated password
3. Use in `.env`:
   ```bash
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-16-character-app-password
   ```

#### Option 2: SendGrid

```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
SMTP_FROM=noreply@yourdomain.com
```

#### Option 3: AWS SES

```bash
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
SMTP_FROM=noreply@yourdomain.com
```

### Redis Setup

#### Local Development (Docker)

```bash
docker run -d \
  --name redis \
  -p 6379:6379 \
  redis:7-alpine
```

#### Production (Redis Cloud)

1. Sign up at [Redis Cloud](https://redis.com/try-free/)
2. Create a database
3. Copy the connection string
4. Add to `.env`:
   ```bash
   REDIS_URL=redis://username:password@host:port
   ```

---

## 🧪 Testing

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Email Service

In development mode, emails are logged to the console. Check your terminal for email content.

### Test Health Endpoint

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development",
  "checks": {
    "database": {
      "status": "up",
      "responseTime": "5ms"
    },
    "memory": {
      "used": "50MB",
      "total": "100MB"
    }
  }
}
```

---

## 🐳 Docker Setup

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Manual Docker Build

```bash
# Build image
docker build -t ariya-backend .

# Run container
docker run -d \
  -p 3000:3000 \
  --env-file .env \
  --name ariya-backend \
  ariya-backend
```

---

## 🚀 Production Deployment

### Pre-Deployment Checklist

- [ ] All environment variables are set
- [ ] Database migrations are up to date
- [ ] Redis is configured and running
- [ ] SMTP credentials are valid
- [ ] SSL/TLS certificates are configured
- [ ] Secrets are stored securely (not in code)
- [ ] Monitoring is set up
- [ ] Backups are configured
- [ ] CI/CD pipeline is working

### Deployment Steps

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Run database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

3. **Start the application:**
   ```bash
   NODE_ENV=production npm start
   ```

4. **Verify deployment:**
   ```bash
   curl https://your-domain.com/api/health
   ```

### Platform-Specific Guides

#### Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

#### AWS EC2

1. SSH into your EC2 instance
2. Clone repository
3. Install dependencies
4. Set up PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start npm --name "ariya-backend" -- start
   pm2 save
   pm2 startup
   ```

#### Heroku

```bash
# Login to Heroku
heroku login

# Create app
heroku create ariya-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:hobby-dev

# Add Redis
heroku addons:create heroku-redis:hobby-dev

# Deploy
git push heroku main
```

---

## 🔍 Troubleshooting

### Common Issues

#### 1. Database Connection Error

**Error:** `Can't reach database server`

**Solution:**
- Check PostgreSQL is running: `pg_isready`
- Verify DATABASE_URL in `.env`
- Check firewall settings
- Ensure database exists

#### 2. Redis Connection Error

**Error:** `Redis connection failed`

**Solution:**
- Check Redis is running: `redis-cli ping`
- Verify REDIS_URL in `.env`
- Application will fall back to memory store

#### 3. Email Not Sending

**Error:** `Failed to send email`

**Solution:**
- Verify SMTP credentials
- Check SMTP_HOST and SMTP_PORT
- Ensure firewall allows SMTP connections
- In development, emails are logged to console

#### 4. Migration Errors

**Error:** `Migration failed`

**Solution:**
```bash
# Check migration status
npx prisma migrate status

# Reset database (WARNING: deletes data)
npx prisma migrate reset

# Or manually fix
npx prisma migrate resolve --rolled-back "migration_name"
npx prisma migrate deploy
```

#### 5. Port Already in Use

**Error:** `Port 3000 is already in use`

**Solution:**
```bash
# Find process using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows

# Or change port in .env
PORT=3001
```

---

## 📊 Monitoring

### Application Logs

Logs are stored in:
- `logs/error.log` - Error logs
- `logs/combined.log` - All logs
- `logs/http.log` - HTTP requests

### Health Monitoring

Set up monitoring for:
- `/api/health` endpoint
- Database connectivity
- Redis connectivity
- Memory usage
- Response times

### Recommended Tools

- **Sentry** - Error tracking
- **DataDog** - APM and monitoring
- **LogDNA** - Log aggregation
- **UptimeRobot** - Uptime monitoring

---

## 🔄 Maintenance

### Regular Tasks

#### Daily
- Monitor error logs
- Check health endpoint
- Review failed requests

#### Weekly
- Clean up expired tokens:
  ```bash
  node -e "require('./src/lib/token-service').TokenService.cleanupExpiredTokens()"
  ```
- Review rate limit logs
- Check database performance

#### Monthly
- Update dependencies:
  ```bash
  npm update
  npm audit fix
  ```
- Rotate secrets
- Review and archive old logs
- Database maintenance:
  ```bash
  VACUUM ANALYZE;  # PostgreSQL
  ```

### Backup Strategy

#### Database Backups

```bash
# Daily backup
pg_dump ariya_db > backup_$(date +%Y%m%d).sql

# Restore from backup
psql ariya_db < backup_20240101.sql
```

#### Redis Backups

```bash
# Save Redis snapshot
redis-cli SAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backup/redis_$(date +%Y%m%d).rdb
```

---

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Redis Documentation](https://redis.io/docs)
- [Winston Logging](https://github.com/winstonjs/winston)
- [Nodemailer Documentation](https://nodemailer.com/about/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the logs in `logs/` directory
2. Review this documentation
3. Check GitHub Issues
4. Contact the development team

---

## ✅ Verification Checklist

After installation, verify everything works:

- [ ] Application starts without errors
- [ ] Health endpoint returns 200 OK
- [ ] Database connection is working
- [ ] Redis connection is working (if configured)
- [ ] Can register a new user
- [ ] Verification email is sent/logged
- [ ] Can log in with credentials
- [ ] Can request password reset
- [ ] Password reset email is sent/logged
- [ ] API endpoints respond correctly
- [ ] Rate limiting is working
- [ ] Logs are being written

---

**Installation Complete! 🎉**

Your Ariya Backend is now ready for development or production use.
