// API Request/Response Types
import { BookingStatus, PaymentStatus, SubscriptionPlan, SubscriptionInterval, SubscriptionStatus } from "@prisma/client";

// Request Body Types
export interface CreateEventRequest {
  name: string;
  type: string;
  date: string; // ISO date string
  location: string;
  budget: number;
  guestCount?: number;
  theme?: string;
  notes?: string;
}

export interface CreateBookingRequest {
  eventId: string;
  vendorId: string;
  amount: number;
  notes?: string;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  amount?: number;
  notes?: string;
  paymentStatus?: PaymentStatus;
}

export interface CreateVendorRequest {
  businessName: string;
  description: string;
  category: string;
  pricing: number;
  location: string;
  portfolio?: string[];
  availability?: any;
}

export interface CreateSubscriptionRequest {
  plan: SubscriptionPlan;
  interval: SubscriptionInterval;
  amount: number;
  startDate: string;
  endDate: string;
  isAutoRenew?: boolean;
  paymentMethodId?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
  profileImage?: string;
  phone?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  password?: string;
  profileImage?: string;
  phone?: string;
}

export interface CreateGuestRequest {
  eventId: string;
  name: string;
  email: string;
  dietaryRestrictions?: string;
  invitedBy: string;
}

export interface UpdateGuestRequest {
  name?: string;
  email?: string;
  rsvp?: 'YES' | 'NO' | 'MAYBE';
  dietaryRestrictions?: string;
  seatNumber?: string;
}

export interface CreateBudgetRequest {
  eventId: string;
  category: string;
  allocated: number;
  notes?: string;
}

export interface UpdateBudgetRequest {
  allocated?: number;
  actual?: number;
  notes?: string;
}

export interface CreateUserRestrictionRequest {
  userId: string;
  type: string; // 'MESSAGING_RESTRICTION', 'ACCOUNT_SUSPENSION', 'FEATURE_LOCK'
  reason: string;
  expiresAt?: string; // ISO date string
}

export interface CreateUserWarningRequest {
  userId: string;
  reason: string;
  isAutomated?: boolean;
}