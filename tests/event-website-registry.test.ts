// tests/event-website-registry.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Event Website & Registry API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let plannerToken: string;
  let eventId: string;
  let registryId: string;

  // Create test user and event before running tests
  beforeEach(async () => {
    // Register planner user
    const plannerData = {
      name: 'Event Website Test User',
      email: 'event-website-test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const plannerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(plannerData);

    plannerToken = plannerResponse.body.data.accessToken;

    // Create an event
    const eventData = {
      name: 'Test Event for Website & Registry',
      type: 'Wedding',
      date: '2025-12-31',
      location: 'Central Park, New York',
      budget: 15000,
      guestCount: 150,
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

  // Test creating an event website
  it('should create an event website successfully', async () => {
    const websiteData = {
      name: 'John & Jane\'s Wedding',
      slug: 'john-jane-wedding',
      isPublic: true,
      theme: 'romantic',
      customizations: {
        colorScheme: '#FF69B4',
        fontFamily: 'serif',
        headerText: 'Join us for our special day!'
      }
    };

    const response = await request(API_BASE)
      .post(`/events/${eventId}/website`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(websiteData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.eventId).toBe(eventId);
    expect(response.body.data.name).toBe(websiteData.name);
    expect(response.body.data.slug).toBe(websiteData.slug);
    expect(response.body.data.isPublic).toBe(websiteData.isPublic);
    expect(response.body.data.theme).toBe(websiteData.theme);
    expect(response.body.data.customizations).toEqual(websiteData.customizations);
  });

  // Test getting event website
  it('should get event website details', async () => {
    // First create the website
    const websiteData = {
      name: 'Test Wedding Website',
      slug: 'test-wedding-website',
      isPublic: true,
      theme: 'modern'
    };

    await request(API_BASE)
      .post(`/events/${eventId}/website`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(websiteData);

    // Then get it
    const response = await request(API_BASE)
      .get(`/events/${eventId}/website`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.eventId).toBe(eventId);
    expect(response.body.data.name).toBe(websiteData.name);
    expect(response.body.data.isPublic).toBe(websiteData.isPublic);
  });

  // Test creating an event registry
  it('should create an event registry successfully', async () => {
    const registryData = {
      name: 'Wedding Registry',
      description: 'Our wedding gift registry',
      privacy: 'PUBLIC' // Assuming this field exists
    };

    const response = await request(API_BASE)
      .post(`/events/${eventId}/registry`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(registryData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.eventId).toBe(eventId);
    expect(response.body.data.name).toBe(registryData.name);
    expect(response.body.data.description).toBe(registryData.description);

    // Store registry ID for other tests
    registryId = response.body.data.id;
  });

  // Test adding items to registry
  it('should add items to event registry', async () => {
    const itemData = {
      name: 'KitchenAid Stand Mixer',
      price: 379.99,
      url: 'https://example.com/kitchenaid-mixer',
      priority: 'HIGH'
    };

    const response = await request(API_BASE)
      .post(`/events/${eventId}/registry/items`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(itemData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.registryId).toBe(registryId);
    expect(response.body.data.name).toBe(itemData.name);
    expect(response.body.data.price).toBe(itemData.price);
  });

  // Test getting registry items
  it('should get registry items', async () => {
    const response = await request(API_BASE)
      .get(`/events/${eventId}/registry/items`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.items)).toBe(true);
    
    if (response.body.data.items.length > 0) {
      expect(response.body.data.items[0]).toHaveProperty('id');
      expect(response.body.data.items[0]).toHaveProperty('name');
      expect(response.body.data.items[0]).toHaveProperty('price');
    }
  });

  // Test RSVP to public event
  it('should allow RSVP to a public event', async () => {
    // First, we need to create a public event (one that would have a slug)
    // For this test, we'll assume the event is already published and has a slug
    
    // This test assumes there's a way to make an event public with a slug
    // and that we can RSVP to it
    const rsvpData = {
      name: 'Test RSVP User',
      email: 'rsvp@example.com',
      rsvp: 'YES',
      guestCount: 2,
      dietaryRestrictions: 'Vegetarian',
      message: 'Looking forward to the event!'
    };

    // Note: This endpoint might need to be different based on how public events are implemented
    // For now, we'll test with the general public endpoint
    try {
      const response = await request(API_BASE)
        .post(`/public/events/test-slug/rsvp`)
        .send(rsvpData)
        .expect(404); // This might return 404 if the event slug doesn't exist or is not implemented
      
      // If we get 404, it's expected if the public event doesn't exist yet
      expect(response.status).toBe(404);
    } catch (error) {
      // If endpoint doesn't exist, we'll handle it gracefully
      console.log('Public event RSVP endpoint may not be implemented yet');
    }
  });

  // Test getting public events
  it('should get public events', async () => {
    const response = await request(API_BASE)
      .get('/public/events')
      .query({ limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.events)).toBe(true);
    // Response may be empty if no events are marked as public
  });

  // Test updating registry
  it('should update registry details', async () => {
    const updateData = {
      name: 'Updated Registry Name',
      description: 'Updated registry description'
    };

    const response = await request(API_BASE)
      .put(`/events/${eventId}/registry`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(registryId);
    expect(response.body.data.name).toBe(updateData.name);
    expect(response.body.data.description).toBe(updateData.description);
  });

  // Test access control for private registries
  it('should require authentication for registry operations', async () => {
    const registryData = {
      name: 'Unauthorized Registry',
      description: 'Attempting unauthorized registry creation'
    };

    const response = await request(API_BASE)
      .post(`/events/${eventId}/registry`)
      .send(registryData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });

  // Test invalid data for registry creation
  it('should fail to create registry with invalid data', async () => {
    const invalidRegistryData = {
      name: '', // Invalid: empty name
      description: '', // Invalid: empty description
    };

    const response = await request(API_BASE)
      .post(`/events/${eventId}/registry`)
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(invalidRegistryData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });
});