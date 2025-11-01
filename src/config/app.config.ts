import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  port: parseInt(process.env.PORT, 10) || 3000,
  environment: process.env.NODE_ENV || 'development',
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(',') || ['*'],
  jwt: {
    secret: process.env.JWT_SECRET || 'default-jwt-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    rememberMeExpiresIn: process.env.JWT_REMEMBER_ME_EXPIRES_IN || '30d',
  },
  database: {
    url: process.env.DATABASE_URL || '',
  },
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },
  logLevel: process.env.LOG_LEVEL || 'info',
}));