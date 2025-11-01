// tests/payment-monetization.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Payment & Monetization API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let plannerToken: string;
  let vendorToken: string;
  let eventId: string;
  let vendorId: string;
  let paymentId: string;

  // Create test users and entities before running tests
  beforeEach(async () => {
    // Register planner user
    const plannerData = {
      name: 'Payment Test Planner',
      email: 'payment-planner@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const plannerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(plannerData);

    plannerToken = plannerResponse.body.data.accessToken;

    // Register vendor user
    const vendorData = {
      name: 'Payment Test Vendor',
      email: 'payment-vendor@example.com',
      password: 'TestPass123!',
      role: 'VENDOR'
    };

    const vendorResponse = await request(API_BASE)
      .post('/auth/register')
      .send(vendorData);

    vendorToken = vendorResponse.body.data.accessToken;

    // Create a vendor profile
    const vendorProfileData = {
      businessName: 'Payment Test Catering',
      description: 'Test vendor for payment testing',
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
      name: 'Payment Test Event',
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

  // Test getting supported currencies
  it('should get supported currencies', async () => {
    const response = await request(API_BASE)
      .get('/currency')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.currencies)).toBe(true);
    
    // Check that we have at least some common currencies
    const currencyCodes = response.body.data.currencies.map((c: any) => c.code);
    expect(currencyCodes).toContain('USD');
    expect(currencyCodes).toContain('EUR');
  });

  // Test currency conversion
  it('should convert currency amounts', async () => {
    const response = await request(API_BASE)
      .get('/currency-converter')
      .query({
        from: 'USD',
        to: 'EUR',
        amount: 100
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('from', 'USD');
    expect(response.body.data).toHaveProperty('to', 'EUR');
    expect(response.body.data).toHaveProperty('amount', 100);
    expect(response.body.data).toHaveProperty('convertedAmount');
    expect(typeof response.body.data.convertedAmount).toBe('number');
    expect(response.body.data).toHaveProperty('rate');
    expect(typeof response.body.data.rate).toBe('number');
  });

  // Test invalid currency conversion
  it('should fail with invalid currency conversion parameters', async () => {
    const response = await request(API_BASE)
      .get('/currency-converter')
      .query({
        from: 'INVALID',
        to: 'INVALID',
        amount: -100 // Invalid: negative amount
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test creating payment intent
  it('should create a payment intent successfully', async () => {
    const paymentIntentData = {
      amount: 1500,
      currency: 'USD',
      description: 'Test payment for event services',
      metadata: {
        eventId: eventId,
        vendorId: vendorId
      }
    };

    const response = await request(API_BASE)
      .post('/payments/intent')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(paymentIntentData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('paymentIntentId');
    expect(response.body.data).toHaveProperty('clientSecret');
    expect(response.body.data.amount).toBe(paymentIntentData.amount);
    expect(response.body.data.currency).toBe(paymentIntentData.currency);
  });

  // Test processing a payment
  it('should process a payment successfully', async () => {
    const paymentData = {
      paymentMethod: 'card_test_123456', // Test payment method ID
      amount: 1500,
      currency: 'USD',
      description: 'Test payment for event services',
      eventId: eventId,
      vendorId: vendorId
    };

    const response = await request(API_BASE)
      .post('/payments/process')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(paymentData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('paymentId');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data.amount).toBe(paymentData.amount);
    expect(response.body.data.currency).toBe(paymentData.currency);
    expect(response.body.data.status).toBe('succeeded'); // Assuming test payments succeed
    
    // Store payment ID for other tests
    paymentId = response.body.data.paymentId;
  });

  // Test getting payment details
  it('should get payment details', async () => {
    const response = await request(API_BASE)
      .get(`/payments/${paymentId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(paymentId);
    expect(response.body.data).toHaveProperty('amount');
    expect(response.body.data).toHaveProperty('currency');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data).toHaveProperty('description');
  });

  // Test getting user payment history
  it('should get user payment history', async () => {
    const response = await request(API_BASE)
      .get('/payments')
      .set('Authorization', `Bearer ${plannerToken}`)
      .query({ limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.payments)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check that payments belong to the user
    if (response.body.data.payments.length > 0) {
      response.body.data.payments.forEach((payment: any) => {
        expect(payment).toHaveProperty('id');
        expect(payment).toHaveProperty('amount');
        expect(payment).toHaveProperty('currency');
        expect(payment).toHaveProperty('status');
      });
    }
  });

  // Test processing payment refund
  it('should process a payment refund', async () => {
    const refundData = {
      reason: 'Requested by customer',
      amount: 500 // Partial refund
    };

    const response = await request(API_BASE)
      .post(`/payments/${paymentId}/refund`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(refundData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('refundId');
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data.status).toBe('succeeded'); // Assuming test refunds succeed
    expect(response.body.data.amountRefunded).toBe(refundData.amount);
  });

  // Test getting subscription plans
  it('should get subscription plans', async () => {
    const response = await request(API_BASE)
      .get('/subscriptions/plans')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.plans)).toBe(true);
    
    // Check that we have at least some subscription plans
    expect(response.body.data.plans.length).toBeGreaterThan(0);
    
    // Check plan structure
    const plan = response.body.data.plans[0];
    expect(plan).toHaveProperty('id');
    expect(plan).toHaveProperty('name');
    expect(plan).toHaveProperty('description');
    expect(plan).toHaveProperty('price');
    expect(plan).toHaveProperty('currency');
    expect(Array.isArray(plan.features)).toBe(true);
  });

  // Test getting user subscriptions
  it('should get user subscriptions', async () => {
    const response = await request(API_BASE)
      .get('/subscriptions')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
    
    // Check subscription structure
    if (response.body.data.subscriptions.length > 0) {
      const subscription = response.body.data.subscriptions[0];
      expect(subscription).toHaveProperty('id');
      expect(subscription).toHaveProperty('planId');
      expect(subscription).toHaveProperty('status');
      expect(subscription).toHaveProperty('startDate');
      expect(subscription).toHaveProperty('endDate');
      expect(subscription).toHaveProperty('amount');
    }
  });

  // Test getting vendor subscriptions
  it('should get vendor subscriptions', async () => {
    const response = await request(API_BASE)
      .get('/vendor-subscriptions')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.subscriptions)).toBe(true);
  });

  // Test getting featured listings
  it('should get featured listings', async () => {
    const response = await request(API_BASE)
      .get('/featured-listings')
      .query({ limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.listings)).toBe(true);
    
    // Check listing structure
    if (response.body.data.listings.length > 0) {
      const listing = response.body.data.listings[0];
      expect(listing).toHaveProperty('vendorId');
      expect(listing).toHaveProperty('businessName');
      expect(listing).toHaveProperty('category');
      expect(listing).toHaveProperty('location');
    }
  });

  // Test vendor insight packages
  it('should get vendor insight packages', async () => {
    const response = await request(API_BASE)
      .get('/vendor-insights')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('packages');
    expect(Array.isArray(response.body.data.packages)).toBe(true);
  });

  // Test event website upgrades
  it('should get event website upgrades', async () => {
    const response = await request(API_BASE)
      .get('/event-website-upgrades')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.upgrades)).toBe(true);
  });

  // Test invalid payment processing
  it('should fail to process payment with invalid data', async () => {
    const invalidPaymentData = {
      paymentMethod: '', // Invalid: empty payment method
      amount: -100, // Invalid: negative amount
      currency: 'INVALID', // Invalid: unsupported currency
      description: '' // Invalid: empty description
    };

    const response = await request(API_BASE)
      .post('/payments/process')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(invalidPaymentData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test unauthorized access to payment endpoints
  it('should require authentication for payment endpoints', async () => {
    const paymentData = {
      amount: 1000,
      currency: 'USD',
      description: 'Unauthorized payment attempt'
    };

    const response = await request(API_BASE)
      .post('/payments/process')
      .send(paymentData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });

  // Test insufficient permissions for admin payment endpoints
  it('should deny access to admin payment endpoints for non-admins', async () => {
    const refundData = {
      reason: 'Unauthorized refund attempt'
    };

    // Regular user trying to access admin refund endpoint
    const response = await request(API_BASE)
      .post(`/admin/payments/refund`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(refundData)
      .expect(403);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Insufficient permissions');
  });
});