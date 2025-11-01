// tests/admin-management.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Admin Management API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let adminToken: string;
  let plannerToken: string;
  let vendorToken: string;
  let vendorId: string;
  let eventId: string;

  // Create test users before running tests
  beforeEach(async () => {
    // Register admin user
    const adminData = {
      name: 'Admin Test User',
      email: 'admin-test@example.com',
      password: 'TestPass123!',
      role: 'ADMIN'
    };

    const adminResponse = await request(API_BASE)
      .post('/auth/register')
      .send(adminData);

    adminToken = adminResponse.body.data.accessToken;

    // Register planner user
    const plannerData = {
      name: 'Planner Test User',
      email: 'planner-admin-test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const plannerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(plannerData);

    plannerToken = plannerResponse.body.data.accessToken;

    // Register vendor user
    const vendorData = {
      name: 'Vendor Test User',
      email: 'vendor-admin-test@example.com',
      password: 'TestPass123!',
      role: 'VENDOR'
    };

    const vendorResponse = await request(API_BASE)
      .post('/auth/register')
      .send(vendorData);

    vendorToken = vendorResponse.body.data.accessToken;

    // Create vendor profile
    const vendorProfileData = {
      businessName: 'Admin Test Catering',
      description: 'Test vendor for admin testing',
      category: 'Catering',
      pricing: 150,
      location: 'New York, NY'
    };

    const vendorResponse2 = await request(API_BASE)
      .post('/vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(vendorProfileData);

    vendorId = vendorResponse2.body.data.id;

    // Create an event
    const eventData = {
      name: 'Admin Test Event',
      type: 'Wedding',
      date: '2025-12-31',
      location: 'Test Venue, NY',
      budget: 10000,
      guestCount: 100,
      theme: 'Garden'
    };

    const eventResponse = await request(API_BASE)
      .post('/events')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(eventData);

    eventId = eventResponse.body.data.id;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test getting admin dashboard
  it('should get admin dashboard data', async () => {
    const response = await request(API_BASE)
      .get('/admin')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalUsers');
    expect(response.body.data).toHaveProperty('totalVendors');
    expect(response.body.data).toHaveProperty('totalEvents');
    expect(response.body.data).toHaveProperty('totalBookings');
    expect(response.body.data).toHaveProperty('revenue');
    
    // Check that data is numerical
    expect(typeof response.body.data.totalUsers).toBe('number');
    expect(typeof response.body.data.totalVendors).toBe('number');
    expect(typeof response.body.data.totalEvents).toBe('number');
    expect(typeof response.body.data.totalBookings).toBe('number');
    expect(typeof response.body.data.revenue).toBe('number');
  });

  // Test getting user analytics
  it('should get user analytics data', async () => {
    const response = await request(API_BASE)
      .get('/admin/analytics/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalUsers');
    expect(response.body.data).toHaveProperty('newUsers');
    expect(response.body.data).toHaveProperty('activeUsers');
    expect(response.body.data).toHaveProperty('userGrowthRate');
    
    // Check types
    expect(typeof response.body.data.totalUsers).toBe('number');
    expect(typeof response.body.data.newUsers).toBe('number');
    expect(typeof response.body.data.activeUsers).toBe('number');
    expect(typeof response.body.data.userGrowthRate).toBe('number');
  });

  // Test getting vendor analytics
  it('should get vendor analytics data', async () => {
    const response = await request(API_BASE)
      .get('/admin/analytics/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalVendors');
    expect(response.body.data).toHaveProperty('newVendors');
    expect(response.body.data).toHaveProperty('verifiedVendors');
    expect(response.body.data).toHaveProperty('vendorGrowthRate');
    
    // Check types
    expect(typeof response.body.data.totalVendors).toBe('number');
    expect(typeof response.body.data.newVendors).toBe('number');
    expect(typeof response.body.data.verifiedVendors).toBe('number');
    expect(typeof response.body.data.vendorGrowthRate).toBe('number');
  });

  // Test getting booking analytics
  it('should get booking analytics data', async () => {
    const response = await request(API_BASE)
      .get('/admin/analytics/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalBookings');
    expect(response.body.data).toHaveProperty('newBookings');
    expect(response.body.data).toHaveProperty('bookingRate');
    expect(response.body.data).toHaveProperty('avgBookingValue');
    
    // Check types
    expect(typeof response.body.data.totalBookings).toBe('number');
    expect(typeof response.body.data.newBookings).toBe('number');
    expect(typeof response.body.data.bookingRate).toBe('number');
    expect(typeof response.body.data.avgBookingValue).toBe('number');
  });

  // Test getting revenue analytics
  it('should get revenue analytics data', async () => {
    const response = await request(API_BASE)
      .get('/admin/analytics/revenue')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalRevenue');
    expect(response.body.data).toHaveProperty('monthlyRevenue');
    expect(response.body.data).toHaveProperty('revenueGrowth');
    expect(response.body.data).toHaveProperty('revenueByCategory');
    
    // Check types
    expect(typeof response.body.data.totalRevenue).toBe('number');
    expect(typeof response.body.data.monthlyRevenue).toBe('number');
    expect(typeof response.body.data.revenueGrowth).toBe('number');
    expect(typeof response.body.data.revenueByCategory).toBe('object');
  });

  // Test getting AI usage analytics
  it('should get AI usage analytics data', async () => {
    const response = await request(API_BASE)
      .get('/admin/analytics/ai-usage')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ startDate: '2024-01-01', endDate: '2024-12-31' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('totalRequests');
    expect(response.body.data).toHaveProperty('successfulRequests');
    expect(response.body.data).toHaveProperty('failedRequests');
    expect(response.body.data).toHaveProperty('averageResponseTime');
    
    // Check types
    expect(typeof response.body.data.totalRequests).toBe('number');
    expect(typeof response.body.data.successfulRequests).toBe('number');
    expect(typeof response.body.data.failedRequests).toBe('number');
    expect(typeof response.body.data.averageResponseTime).toBe('number');
  });

  // Test getting all users (admin)
  it('should get all users for admin', async () => {
    const response = await request(API_BASE)
      .get('/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.users)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check user structure
    if (response.body.data.users.length > 0) {
      const user = response.body.data.users[0];
      expect(user).toHaveProperty('id');
      expect(user).toHaveProperty('name');
      expect(user).toHaveProperty('email');
      expect(user).toHaveProperty('role');
      expect(user).toHaveProperty('createdAt');
    }
  });

  // Test getting all vendors (admin)
  it('should get all vendors for admin', async () => {
    const response = await request(API_BASE)
      .get('/admin/vendors')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.vendors)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check vendor structure
    if (response.body.data.vendors.length > 0) {
      const vendor = response.body.data.vendors[0];
      expect(vendor).toHaveProperty('id');
      expect(vendor).toHaveProperty('businessName');
      expect(vendor).toHaveProperty('category');
      expect(vendor).toHaveProperty('location');
      expect(vendor).toHaveProperty('isVerified');
      expect(vendor).toHaveProperty('rating');
    }
  });

  // Test approving a vendor
  it('should approve a vendor', async () => {
    const response = await request(API_BASE)
      .post(`/admin/vendors/${vendorId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(vendorId);
    expect(response.body.data.isVerified).toBe(true);
    expect(response.body.message).toBe('Vendor approved successfully');
  });

  // Test rejecting a vendor
  it('should reject a vendor', async () => {
    // First reset vendor to unverified state (this would normally be done by admin)
    // For test purposes, we'll simulate this
    
    const response = await request(API_BASE)
      .post(`/admin/vendors/${vendorId}/reject`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(vendorId);
    expect(response.body.message).toBe('Vendor rejected successfully');
  });

  // Test getting pending vendors
  it('should get pending vendors', async () => {
    const response = await request(API_BASE)
      .get('/admin/vendors/pending')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.vendors)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
  });

  // Test getting transaction fees
  it('should get transaction fees configuration', async () => {
    const response = await request(API_BASE)
      .get('/admin/transaction-fees')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('fees');
    expect(Array.isArray(response.body.data.fees)).toBe(true);
    
    // Check fee structure
    if (response.body.data.fees.length > 0) {
      const fee = response.body.data.fees[0];
      expect(fee).toHaveProperty('id');
      expect(fee).toHaveProperty('type');
      expect(fee).toHaveProperty('percentage');
      expect(fee).toHaveProperty('fixedAmount');
    }
  });

  // Test updating transaction fees
  it('should update transaction fees', async () => {
    const updateFeeData = {
      fees: [
        {
          id: 'stripe_fee',
          type: 'STRIPE',
          percentage: 2.9,
          fixedAmount: 0.30
        }
      ]
    };

    const response = await request(API_BASE)
      .put('/admin/transaction-fees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(updateFeeData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Transaction fees updated successfully');
  });

  // Test getting system logs
  it('should get system logs', async () => {
    const response = await request(API_BASE)
      .get('/admin/system-logs')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.logs)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check log structure
    if (response.body.data.logs.length > 0) {
      const log = response.body.data.logs[0];
      expect(log).toHaveProperty('id');
      expect(log).toHaveProperty('level');
      expect(log).toHaveProperty('message');
      expect(log).toHaveProperty('timestamp');
    }
  });

  // Test moderation reports
  it('should get moderation reports', async () => {
    const response = await request(API_BASE)
      .get('/moderation/reports')
      .set('Authorization', `Bearer ${adminToken}`)
      .query({ status: 'PENDING_REVIEW', page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.reports)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check report structure
    if (response.body.data.reports.length > 0) {
      const report = response.body.data.reports[0];
      expect(report).toHaveProperty('id');
      expect(report).toHaveProperty('reportedUserId');
      expect(report).toHaveProperty('contentId');
      expect(report).toHaveProperty('contentType');
      expect(report).toHaveProperty('reason');
      expect(report).toHaveProperty('status');
    }
  });

  // Test submitting a moderation report
  it('should submit a moderation report', async () => {
    const reportData = {
      reportedUserId: vendorId,
      contentId: eventId,
      contentType: 'event',
      reason: 'Inappropriate content'
    };

    const response = await request(API_BASE)
      .post('/moderation/report')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(reportData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Report submitted successfully');
  });

  // Test checking user action permissions
  it('should check if user can perform an action', async () => {
    const actionData = {
      action: 'CREATE_EVENT'
    };

    const response = await request(API_BASE)
      .post('/moderation/action-check')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(actionData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('canPerform');
    expect(typeof response.body.data.canPerform).toBe('boolean');
  });

  // Test getting user restrictions
  it('should get user restrictions', async () => {
    const response = await request(API_BASE)
      .get('/moderation/restrictions')
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data.user).toHaveProperty('id');
    expect(response.body.data.user).toHaveProperty('restrictions');
    expect(response.body.data.user).toHaveProperty('permissions');
    expect(response.body.data.user).toHaveProperty('actions');
  });

  // Test unauthorized access to admin endpoints
  it('should deny access to admin endpoints for non-admins', async () => {
    const response = await request(API_BASE)
      .get('/admin')
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Insufficient permissions');
  });

  // Test unauthorized access to admin vendor approval
  it('should deny access to vendor approval for non-admins', async () => {
    const response = await request(API_BASE)
      .post(`/admin/vendors/${vendorId}/approve`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Insufficient permissions');
  });

  // Test invalid transaction fee update
  it('should fail to update transaction fees with invalid data', async () => {
    const invalidFeeData = {
      fees: [
        {
          id: '',
          type: 'INVALID_TYPE',
          percentage: -5, // Invalid: negative percentage
          fixedAmount: -1 // Invalid: negative amount
        }
      ]
    };

    const response = await request(API_BASE)
      .put('/admin/transaction-fees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(invalidFeeData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test admin access to regular user endpoints
  it('should allow admin to access user endpoints', async () => {
    // Admin should be able to get user details
    const response = await request(API_BASE)
      .get(`/users/${vendorId}`) // Using vendorId as a user ID here
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('email');
  });
});