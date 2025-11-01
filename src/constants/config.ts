// Application Configuration Constants
export const APP_CONFIG = {
  NAME: 'Ariya Event Platform',
  VERSION: '1.0.0',
  ENVIRONMENT: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3000', 10),
} as const;

// Feature Flags
export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: process.env.ENABLE_ANALYTICS === 'true',
  ENABLE_EMAIL_NOTIFICATIONS: process.env.ENABLE_EMAIL_NOTIFICATIONS !== 'false',
  ENABLE_PUSH_NOTIFICATIONS: process.env.ENABLE_PUSH_NOTIFICATIONS !== 'false',
  ENABLE_FILE_UPLOADS: process.env.ENABLE_FILE_UPLOADS !== 'false',
} as const;

// Rate Limiting
export const RATE_LIMITING = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100, // Limit each IP to 100 requests per windowMs
  MESSAGE: 'Too many requests from this IP, please try again later',
} as const;

// Currency Constants
export const CURRENCY = {
  DEFAULT_CURRENCY: 'NGN',
  SUPPORTED_CURRENCIES: ['NGN', 'USD', 'EUR', 'GBP', 'CAD', 'AUD', 'GHS', 'KES', 'UGX', 'ZAR'],
  DECIMAL_PLACES: 2,
} as const;

// Subscription Constants
export const SUBSCRIPTION = {
  FREE_LISTINGS_PER_MONTH: 3,
  PREMIUM_LISTINGS_PER_MONTH: 10,
  PRO_LISTINGS_PER_MONTH: 20,
} as const;

// Event Constants
export const EVENT = {
  MAX_GUESTS_FREE_TIER: 100,
  MAX_GUESTS_PRO_TIER: 1000,
  MAX_GUESTS_PREMIUM_TIER: 5000,
  MAX_BUDGET_DISPLAY_LENGTH: 12, // For UI formatting
} as const;

// Vendor Constants
export const VENDOR = {
  MAX_PORTFOLIO_IMAGES: 10,
  MIN_RATING: 1,
  MAX_RATING: 5,
  RATING_PRECISION: 1,
} as const;

// File Upload Constants
export const FILE_UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB in bytes
  ALLOWED_FILE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  MAX_FILES_PER_UPLOAD: 5,
} as const;

// Email Constants
export const EMAIL = {
  FROM_ADDRESS: process.env.EMAIL_FROM || 'noreply@ariya.com',
  FROM_NAME: process.env.EMAIL_FROM_NAME || 'Ariya Event Platform',
  MAX_RECIPIENTS: 10,
} as const;