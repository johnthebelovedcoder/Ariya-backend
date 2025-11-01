// Admin Service Types
import { UserRole } from '@prisma/client';

export interface AdminDashboardMetrics {
  totalUsers: number;
  totalVendors: number;
  totalEvents: number;
  totalBookings: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

export interface AdminUserFilters {
  role?: UserRole;
  page?: number;
  limit?: number;
  search?: string;
}

export interface AdminVendorFilters {
  status?: string; // 'approved', 'pending', 'rejected'
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
}