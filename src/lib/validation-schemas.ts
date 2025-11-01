import { z } from 'zod';

// Enum definitions matching Prisma schema
// These will be validated against the actual Prisma enums at runtime
const UserRoleEnum = z.enum(['PLANNER', 'VENDOR', 'ADMIN']);
const BookingStatusEnum = z.enum(['PENDING', 'CONFIRMED', 'CANCELLED']);
const PaymentStatusEnum = z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']);
const RSVPStatusEnum = z.enum(['YES', 'NO', 'MAYBE']);
const SubscriptionPlanEnum = z.enum(['FREE', 'PRO', 'PREMIUM']);
const SubscriptionIntervalEnum = z.enum(['MONTHLY', 'YEARLY']);

/**
 * Reusable validation schemas for API requests
 * Use these with Zod's parse() or safeParse() methods
 */

// ============================================
// Common Schemas
// ============================================

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const EmailSchema = z.string().email('Invalid email format').toLowerCase();

export const PasswordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format');

export const PaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});

export const DateStringSchema = z.string().datetime('Invalid ISO date format');

// ============================================
// Authentication Schemas
// ============================================

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, 'Password is required'),
  rememberMe: z.boolean().optional(),
});

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(50),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(50),
  role: UserRoleEnum.optional(),
  phone: PhoneSchema.optional(),
});

export const ForgotPasswordSchema = z.object({
  email: EmailSchema,
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: PasswordSchema,
});

export const VerifyEmailSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

export const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ============================================
// User Schemas
// ============================================

export const CreateUserSchema = z.object({
  name: z.string().min(2).max(100),
  email: EmailSchema,
  password: PasswordSchema,
  role: UserRoleEnum.optional(),
  profileImage: z.string().url().optional(),
  phone: PhoneSchema.optional(),
  country: z.string().length(2).optional(), // ISO 3166-1 alpha-2
  currency: z.string().length(3).optional(), // ISO 4217
});

export const UpdateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: EmailSchema.optional(),
  profileImage: z.string().url().optional(),
  phone: PhoneSchema.optional(),
  country: z.string().length(2).optional(),
  currency: z.string().length(3).optional(),
  timezone: z.string().optional(),
  preferredLocale: z.string().optional(),
});

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: PasswordSchema,
});

// ============================================
// Event Schemas
// ============================================

export const CreateEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  type: z.string().min(1, 'Event type is required').max(100),
  date: DateStringSchema,
  location: z.string().min(1, 'Location is required').max(500),
  budget: z.number().positive('Budget must be positive'),
  guestCount: z.number().int().nonnegative().optional(),
  theme: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
});

export const UpdateEventSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  type: z.string().min(1).max(100).optional(),
  date: DateStringSchema.optional(),
  location: z.string().min(1).max(500).optional(),
  budget: z.number().positive().optional(),
  guestCount: z.number().int().nonnegative().optional(),
  theme: z.string().max(100).optional(),
  notes: z.string().max(2000).optional(),
  status: z.string().optional(),
});

// ============================================
// Vendor Schemas
// ============================================

export const CreateVendorSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(200),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
  category: z.string().min(1, 'Category is required').max(100),
  pricing: z.number().positive('Pricing must be positive'),
  location: z.string().min(1, 'Location is required').max(500),
  portfolio: z.array(z.string().url()).optional(),
  availability: z.record(z.string(), z.any()).optional()
});

export const UpdateVendorSchema = z.object({
  businessName: z.string().min(2).max(200).optional(),
  description: z.string().min(10).max(2000).optional(),
  category: z.string().min(1).max(100).optional(),
  pricing: z.number().positive().optional(),
  location: z.string().min(1).max(500).optional(),
  portfolio: z.array(z.string().url()).optional(),
  availability: z.record(z.string(), z.any()).optional()
});

export const VendorSearchSchema = PaginationSchema.extend({
  category: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.coerce.number().positive().optional(),
  maxPrice: z.coerce.number().positive().optional(),
  minRating: z.coerce.number().min(0).max(5).optional(),
  search: z.string().optional(),
});

// ============================================
// Booking Schemas
// ============================================

export const CreateBookingSchema = z.object({
  eventId: UUIDSchema,
  vendorId: UUIDSchema,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('NGN'),
  notes: z.string().max(1000).optional(),
});

export const UpdateBookingSchema = z.object({
  status: BookingStatusEnum.optional(),
  amount: z.number().positive().optional(),
  notes: z.string().max(1000).optional(),
  paymentStatus: PaymentStatusEnum.optional(),
});

// ============================================
// Guest Schemas
// ============================================

export const CreateGuestSchema = z.object({
  eventId: UUIDSchema,
  name: z.string().min(1, 'Guest name is required').max(200),
  email: EmailSchema,
  dietaryRestrictions: z.string().max(500).optional(),
  invitedBy: z.string().min(1, 'Invited by is required').max(200),
});

export const UpdateGuestSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  email: EmailSchema.optional(),
  rsvp: RSVPStatusEnum.optional(),
  dietaryRestrictions: z.string().max(500).optional(),
  seatNumber: z.string().max(20).optional(),
});

export const BulkCreateGuestsSchema = z.object({
  eventId: UUIDSchema,
  guests: z.array(
    z.object({
      name: z.string().min(1).max(200),
      email: EmailSchema,
      dietaryRestrictions: z.string().max(500).optional(),
      invitedBy: z.string().min(1).max(200),
    })
  ).min(1, 'At least one guest is required').max(100, 'Maximum 100 guests per batch'),
});

// ============================================
// Budget Schemas
// ============================================

export const CreateBudgetSchema = z.object({
  eventId: UUIDSchema,
  category: z.string().min(1, 'Category is required').max(100),
  allocated: z.number().positive('Allocated amount must be positive'),
  notes: z.string().max(1000).optional(),
});

export const UpdateBudgetSchema = z.object({
  allocated: z.number().positive().optional(),
  actual: z.number().nonnegative().optional(),
  notes: z.string().max(1000).optional(),
});

// ============================================
// Payment Schemas
// ============================================

export const InitializePaymentSchema = z.object({
  bookingId: UUIDSchema,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).optional().default('NGN'),
  email: EmailSchema,
  callbackUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.any()).optional(),
});

export const VerifyPaymentSchema = z.object({
  reference: z.string().min(1, 'Payment reference is required'),
});

export const RefundPaymentSchema = z.object({
  reason: z.string().min(10, 'Refund reason must be at least 10 characters').max(500),
  amount: z.number().positive().optional(), // Partial refund
});

// ============================================
// Review Schemas
// ============================================

export const CreateReviewSchema = z.object({
  bookingId: UUIDSchema,
  vendorId: UUIDSchema,
  rating: z.object({
    overall: z.number().min(1).max(5),
    quality: z.number().min(1).max(5).optional(),
    communication: z.number().min(1).max(5).optional(),
    punctuality: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
  }),
  review: z.string().min(10, 'Review must be at least 10 characters').max(2000),
  photos: z.array(z.string().url()).max(5).optional(),
  wouldRecommend: z.boolean().optional(),
  tags: z.array(z.string()).max(10).optional(),
});

export const UpdateReviewSchema = z.object({
  rating: z.object({
    overall: z.number().min(1).max(5).optional(),
    quality: z.number().min(1).max(5).optional(),
    communication: z.number().min(1).max(5).optional(),
    punctuality: z.number().min(1).max(5).optional(),
    value: z.number().min(1).max(5).optional(),
  }).optional(),
  review: z.string().min(10).max(2000).optional(),
  photos: z.array(z.string().url()).max(5).optional(),
});

export const ReviewResponseSchema = z.object({
  response: z.string().min(10, 'Response must be at least 10 characters').max(1000),
});

export const ReviewHelpfulSchema = z.object({
  helpful: z.boolean(),
});

// ============================================
// Notification Schemas
// ============================================

export const CreateNotificationSchema = z.object({
  userId: UUIDSchema,
  type: z.enum(['BOOKING', 'PAYMENT', 'MESSAGE', 'REVIEW', 'REMINDER', 'SYSTEM']),
  title: z.string().min(1).max(200),
  message: z.string().min(1).max(1000),
  data: z.record(z.string(), z.any()).optional(),
  actionUrl: z.string().url().optional(),
});

export const NotificationPreferencesSchema = z.object({
  email: z.boolean().optional(),
  push: z.boolean().optional(),
  sms: z.boolean().optional(),
  bookingUpdates: z.boolean().optional(),
  paymentUpdates: z.boolean().optional(),
  messages: z.boolean().optional(),
  reviews: z.boolean().optional(),
  reminders: z.boolean().optional(),
  marketing: z.boolean().optional(),
});

// ============================================
// Availability Schemas
// ============================================

export const SetAvailabilitySchema = z.object({
  dates: z.record(
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
    z.object({
      status: z.enum(['available', 'booked', 'blocked']),
      slots: z.number().int().nonnegative().optional(),
      notes: z.string().max(500).optional(),
    })
  ),
  recurringRules: z.object({
    weekdays: z.enum(['available', 'blocked', 'limited']).optional(),
    weekends: z.enum(['available', 'blocked', 'limited']).optional(),
    defaultSlots: z.number().int().positive().optional(),
  }).optional(),
});

export const CheckAvailabilitySchema = z.object({
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

export const BulkAvailabilitySchema = z.object({
  vendorIds: z.array(UUIDSchema).min(1).max(20),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
});

// ============================================
// Message Schemas
// ============================================

export const SendMessageSchema = z.object({
  receiverId: UUIDSchema,
  content: z.string().min(1, 'Message content is required').max(5000),
});

export const MarkMessageReadSchema = z.object({
  messageIds: z.array(UUIDSchema).min(1, 'At least one message ID is required'),
});

// ============================================
// Subscription Schemas
// ============================================

export const CreateSubscriptionSchema = z.object({
  plan: SubscriptionPlanEnum,
  interval: SubscriptionIntervalEnum,
  amount: z.number().positive('Amount must be positive'),
  currency: z.string().length(3).default('NGN'),
  startDate: DateStringSchema,
  endDate: DateStringSchema,
  isAutoRenew: z.boolean().default(true),
  paymentMethodId: z.string().optional(),
});

// ============================================
// AI Schemas
// ============================================

export const AIBudgetEstimateSchema = z.object({
  eventType: z.string().min(1, 'Event type is required'),
  guestCount: z.number().int().positive('Guest count must be positive'),
  location: z.string().min(1, 'Location is required'),
  currency: z.string().length(3).default('NGN'),
});

export const AIVendorRecommendationSchema = z.object({
  eventId: UUIDSchema,
  category: z.string().min(1, 'Category is required'),
  budget: z.number().positive('Budget must be positive').optional(),
  location: z.string().optional(),
});

export const AIFeedbackSchema = z.object({
  recommendationId: UUIDSchema,
  rating: z.number().int().min(1).max(5),
  feedback: z.string().max(1000).optional(),
});

// ============================================
// Admin Schemas
// ============================================

export const AdminUserSearchSchema = PaginationSchema.extend({
  role: UserRoleEnum.optional(),
  isVerified: z.coerce.boolean().optional(),
  isSuspended: z.coerce.boolean().optional(),
  search: z.string().optional(),
});

export const AdminUpdateUserSchema = z.object({
  isVerified: z.boolean().optional(),
  isSuspended: z.boolean().optional(),
  role: UserRoleEnum.optional(),
});

// ============================================
// File Upload Schemas
// ============================================

export const FileUploadSchema = z.object({
  filename: z.string().min(1, 'Filename is required'),
  mimetype: z.string().regex(/^[a-z]+\/[a-z0-9\-\+\.]+$/i, 'Invalid MIME type'),
  size: z.number().positive().max(5242880, 'File size must not exceed 5MB'),
});

/**
 * Helper function to validate request body with a Zod schema
 * Returns validated data or throws an error with detailed messages
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}

/**
 * Helper function to safely validate request body
 * Returns { success: true, data } or { success: false, errors }
 */
export function safeValidateSchema<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: z.ZodError } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, errors: result.error };
}
