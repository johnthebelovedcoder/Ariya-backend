// Common API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  errors?: any;
}

export interface ApiPagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: ApiPagination;
}

// User-related Types
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
  phone?: string;
  country?: string;
  currency?: string;
  timezone?: string;
  preferredLocale?: string;
}

// Event-related Types
export interface EventData {
  id: string;
  userId: string;
  name: string;
  type: string;
  date: Date;
  location: string;
  budget: number;
  status?: string;
  guestCount?: number;
  theme?: string;
  notes?: string;
}

// Booking-related Types
export interface BookingData {
  id: string;
  eventId: string;
  vendorId: string;
  status: string;
  amount: number;
  currency: string;
  customerTotal?: number;
  vendorNet?: number;
  ariyaRevenue?: number;
  paymentStatus: string;
  notes?: string;
}

// Vendor-related Types
export interface VendorData {
  id: string;
  userId: string;
  businessName: string;
  description: string;
  category: string;
  pricing: number;
  location: string;
  portfolio: string[];
  ratingAverage: number;
  totalReviews: number;
}