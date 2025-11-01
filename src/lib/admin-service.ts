import { 
  AdminAuthService,
  AdminDashboardService,
  AdminUserService,
  AdminVendorService,
  AdminSystemLogsService,
  AdminUserAnalyticsService,
  AdminBookingAnalyticsService,
  AdminVendorAnalyticsService,
  AdminAIAnalyticsService,
  AdminEventAnalyticsService
} from './admin';

import { AdminUserFilters, AdminVendorFilters } from './admin/types';

export class AdminService {
  // Verify if user has admin privileges
  static async verifyAdmin(userId: string): Promise<boolean> {
    return AdminAuthService.verifyAdmin(userId);
  }

  // Get admin dashboard metrics
  static async getDashboardMetrics() {
    return AdminDashboardService.getDashboardMetrics();
  }

  // Get user list with filters
  static async getUsers(filters: AdminUserFilters = {}) {
    return AdminUserService.getUsers(filters);
  }

  // Update user status (activate/deactivate)
  static async updateUserStatus(userId: string, isActive: boolean) {
    return AdminUserService.updateUserStatus(userId, isActive);
  }

  // Get pending vendor approvals
  static async getPendingVendors(filters: AdminVendorFilters = {}) {
    return AdminVendorService.getPendingVendors(filters);
  }

  // Approve vendor
  static async approveVendor(vendorId: string, adminUserId: string) {
    return AdminVendorService.approveVendor(vendorId, adminUserId);
  }

  // Reject vendor
  static async rejectVendor(vendorId: string, adminUserId: string, reason: string) {
    return AdminVendorService.rejectVendor(vendorId, adminUserId, reason);
  }

  // Get user acquisition metrics
  static async getUserAcquisitionMetrics() {
    return AdminUserAnalyticsService.getUserAcquisitionMetrics();
  }

  // Get booking metrics
  static async getBookingMetrics() {
    return AdminBookingAnalyticsService.getBookingMetrics();
  }

  // Get vendor performance metrics
  static async getVendorPerformanceMetrics() {
    return AdminVendorAnalyticsService.getVendorPerformanceMetrics();
  }

  // Get AI feature usage metrics
  static async getAIUsageMetrics() {
    return AdminAIAnalyticsService.getAIUsageMetrics();
  }

  // Get event creation metrics
  static async getEventCreationMetrics(filters?: {
    startDate?: Date;
    endDate?: Date;
    eventType?: string;
  }) {
    return AdminEventAnalyticsService.getEventCreationMetrics(filters);
  }

  // Get system logs
  static async getSystemLogs(page: number = 1, limit: number = 50) {
    return AdminSystemLogsService.getSystemLogs(page, limit);
  }
}