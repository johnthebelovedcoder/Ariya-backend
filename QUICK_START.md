# ⚡ Quick Start Guide

Get Ariya Backend running in 5 minutes!

---

## 🚀 Installation (3 commands)

```bash
# 1. Install dependencies
npm install winston nodemailer redis @types/nodemailer

# 2. Run migrations
npx prisma migrate dev --name add_production_features && npx prisma generate

# 3. Start the app
npm run dev
```

---

## 📝 Minimum Required Setup

### 1. Create `.env` file

```bash
# Copy example
cp env.example .env
```

### 2. Edit `.env` with minimum config

```bash
# Database (Required)
DATABASE_URL=postgresql://user:password@localhost:5432/ariya_db

# Secrets (Required - Generate with: openssl rand -base64 32)
JWT_SECRET=your-32-char-secret-here
JWT_REFRESH_SECRET=your-32-char-secret-here
NEXTAUTH_SECRET=your-32-char-secret-here
NEXTAUTH_URL=http://localhost:3000

# Email (Optional for dev - emails logged to console)
# SMTP_HOST=smtp.gmail.com
# SMTP_PORT=587
# SMTP_USER=your-email@gmail.com
# SMTP_PASSWORD=your-app-password

# Redis (Optional for dev - uses memory fallback)
# REDIS_URL=redis://localhost:6379
```

---

## ✅ Verify Installation

```bash
# Check health
curl http://localhost:3000/api/health

# Expected: {"status":"healthy",...}
```

---

## 🧪 Test Key Features

### 1. Register User
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### 2. Check Console for Verification Email
Look for email content in your terminal (development mode).

### 3. Login
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
```

---

## 🔧 Common Issues

### Port 3000 in use?
```bash
# Change port in .env
PORT=3001
```

### Database connection error?
```bash
# Create database
createdb ariya_db

# Or check DATABASE_URL in .env
```

### TypeScript errors?
```bash
# Generate Prisma client
npx prisma generate
```

---

## 📚 Next Steps

1. ✅ **Read INSTALLATION.md** - Full installation guide
2. ✅ **Read PRODUCTION_READY_GUIDE.md** - Production deployment
3. ✅ **Configure SMTP** - For email sending
4. ✅ **Set up Redis** - For production rate limiting
5. ✅ **Review API-DOCS.md** - API documentation

---

## 🆘 Need Help?

- **Installation issues**: See `INSTALLATION.md`
- **Production deployment**: See `PRODUCTION_READY_GUIDE.md`
- **Implementation details**: See `IMPLEMENTATION_GUIDE.md`
- **API usage**: See `API-DOCS.md`

---

**That's it! You're ready to develop! 🎉**
