// tests/bookings.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Booking API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let plannerToken: string;
  let vendorToken: string;
  let vendorId: string;
  let eventId: string;
  let bookingId: string;

  // Create test users and entities before running tests
  beforeEach(async () => {
    // Register planner user
    const plannerData = {
      name: 'Planner Test User',
      email: 'planner-test@example.com',
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
      email: 'vendor-booking-test@example.com',
      password: 'TestPass123!',
      role: 'VENDOR'
    };

    const vendorResponse = await request(API_BASE)
      .post('/auth/register')
      .send(vendorData);

    vendorToken = vendorResponse.body.data.accessToken;

    // Create a vendor profile
    const vendorProfileData = {
      businessName: 'Booking Test Catering',
      description: 'Test catering service for bookings',
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
      name: 'Test Booking Event',
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

  // Test creating a booking
  it('should create a new booking successfully', async () => {
    const bookingData = {
      eventId: eventId,
      vendorId: vendorId,
      amount: 5000,
      notes: 'Test booking for QA testing'
    };

    const response = await request(API_BASE)
      .post('/bookings')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(bookingData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.eventId).toBe(bookingData.eventId);
    expect(response.body.data.vendorId).toBe(bookingData.vendorId);
    expect(response.body.data.amount).toBe(bookingData.amount);
    expect(response.body.data.status).toBe('PENDING');
    expect(response.body.data.paymentStatus).toBe('PENDING');

    // Store booking ID for other tests
    bookingId = response.body.data.id;
  });

  // Test getting bookings for an event
  it('should get bookings for an event', async () => {
    const response = await request(API_BASE)
      .get('/bookings')
      .set('Authorization', `Bearer ${plannerToken}`)
      .query({ eventId: eventId })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.bookings)).toBe(true);
    expect(response.body.data.bookings.length).toBeGreaterThan(0);
    
    // Check that first booking belongs to the right event
    expect(response.body.data.bookings[0].eventId).toBe(eventId);
  });

  // Test getting bookings for a vendor
  it('should get bookings for a vendor', async () => {
    const response = await request(API_BASE)
      .get('/bookings')
      .set('Authorization', `Bearer ${vendorToken}`)
      .query({ vendorId: vendorId })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.bookings)).toBe(true);
    
    // Check that bookings belong to the right vendor
    if (response.body.data.bookings.length > 0) {
      response.body.data.bookings.forEach((booking: any) => {
        expect(booking.vendorId).toBe(vendorId);
      });
    }
  });

  // Test updating a booking
  it('should update booking status', async () => {
    const updateData = {
      status: 'CONFIRMED',
      notes: 'Updated booking status to confirmed'
    };

    const response = await request(API_BASE)
      .put(`/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(bookingId);
    expect(response.body.data.status).toBe(updateData.status);
    expect(response.body.data.notes).toBe(updateData.notes);
  });

  // Test booking cancellation
  it('should cancel a booking', async () => {
    const response = await request(API_BASE)
      .post(`/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(bookingId);
    expect(response.body.data.status).toBe('CANCELLED');
  });

  // Test creating a booking with invalid data
  it('should fail to create booking with invalid data', async () => {
    const invalidBookingData = {
      eventId: 'invalid-id', // Invalid ID format
      vendorId: 'invalid-id', // Invalid ID format
      amount: -100 // Invalid: negative amount
    };

    const response = await request(API_BASE)
      .post('/bookings')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(invalidBookingData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });
});