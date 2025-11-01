// tests/events.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Event API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let plannerToken: string;
  let eventId: string;

  // Create a test user before running tests
  beforeEach(async () => {
    // Register planner user
    const plannerData = {
      name: 'Event Test User',
      email: 'event-test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const plannerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(plannerData);

    plannerToken = plannerResponse.body.data.accessToken;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test creating an event
  it('should create a new event successfully', async () => {
    const eventData = {
      name: 'Test Event for QA',
      type: 'Wedding',
      date: '2025-12-31',
      location: 'Central Park, New York',
      budget: 15000,
      guestCount: 150,
      theme: 'Garden',
      notes: 'Test event for QA validation'
    };

    const response = await request(API_BASE)
      .post('/events')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(eventData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(eventData.name);
    expect(response.body.data.type).toBe(eventData.type);
    expect(response.body.data.location).toBe(eventData.location);
    expect(response.body.data.budget).toBe(eventData.budget);
    expect(response.body.data.guestCount).toBe(eventData.guestCount);

    // Store event ID for other tests
    eventId = response.body.data.id;
  });

  // Test getting all events for a user
  it('should get all events for the authenticated user', async () => {
    const response = await request(API_BASE)
      .get('/events')
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.events)).toBe(true);
    expect(response.body.data.events.length).toBeGreaterThan(0);

    // Check that the first event belongs to the user
    expect(response.body.data.events[0]).toHaveProperty('id');
    expect(response.body.data.events[0]).toHaveProperty('name');
    expect(response.body.data.events[0]).toHaveProperty('userId');
  });

  // Test getting a specific event
  it('should get a specific event by ID', async () => {
    const response = await request(API_BASE)
      .get(`/events/${eventId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(eventId);
    expect(response.body.data).toHaveProperty('name');
    expect(response.body.data).toHaveProperty('type');
    expect(response.body.data).toHaveProperty('date');
  });

  // Test updating an event
  it('should update event details', async () => {
    const updateData = {
      name: 'Updated Test Event Name',
      budget: 18000,
      guestCount: 200,
      notes: 'Updated notes for QA test'
    };

    const response = await request(API_BASE)
      .put(`/events/${eventId}`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(eventId);
    expect(response.body.data.name).toBe(updateData.name);
    expect(response.body.data.budget).toBe(updateData.budget);
    expect(response.body.data.guestCount).toBe(updateData.guestCount);
    expect(response.body.data.notes).toBe(updateData.notes);
  });

  // Test creating event with invalid data
  it('should fail to create event with invalid data', async () => {
    const invalidEventData = {
      name: '', // Invalid: empty name
      type: '', // Invalid: empty type
      date: 'invalid-date', // Invalid: wrong format
      location: '', // Invalid: empty location
      budget: -1000, // Invalid: negative budget
      guestCount: -50 // Invalid: negative guest count
    };

    const response = await request(API_BASE)
      .post('/events')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(invalidEventData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test event search/filtering functionality
  it('should search events (when implemented)', async () => {
    // The search endpoint might not exist yet but we can test for it
    const response = await request(API_BASE)
      .get('/events')
      .set('Authorization', `Bearer ${plannerToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.events)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    expect(response.body.data.pagination).toHaveProperty('page');
    expect(response.body.data.pagination).toHaveProperty('limit');
  });

  // Test access control - should not allow unauthorized access
  it('should require authentication for event creation', async () => {
    const eventData = {
      name: 'Unauthorized Test Event',
      type: 'Meeting',
      date: '2025-12-31',
      location: 'Test Location',
      budget: 5000,
      guestCount: 50
    };

    const response = await request(API_BASE)
      .post('/events')
      .send(eventData)
      .expect(401); // Should return 401 Unauthorized

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });
});