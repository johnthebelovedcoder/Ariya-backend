// tests/vendors.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Vendor API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let authToken: string;
  let vendorId: string;

  // Create a mock user and get auth token before running tests
  beforeEach(async () => {
    // Register a user first
    const userData = {
      name: 'Vendor Test User',
      email: 'vendor-test@example.com',
      password: 'TestPass123!',
      role: 'VENDOR'
    };

    const registerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.accessToken;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test vendor creation
  it('should create a new vendor successfully', async () => {
    const vendorData = {
      businessName: 'Test Catering Business',
      description: 'Best catering service in town',
      category: 'Catering',
      pricing: 150,
      location: 'New York, NY',
      portfolio: ['https://example.com/image1.jpg'],
      availability: {
        monday: { start: '09:00', end: '18:00' },
        tuesday: { start: '09:00', end: '18:00' }
      }
    };

    const response = await request(API_BASE)
      .post('/vendors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(vendorData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.businessName).toBe(vendorData.businessName);
    expect(response.body.data.category).toBe(vendorData.category);
    expect(response.body.data.location).toBe(vendorData.location);
    
    // Store vendor ID for other tests
    vendorId = response.body.data.id;
  });

  // Test getting all vendors
  it('should get all vendors', async () => {
    const response = await request(API_BASE)
      .get('/vendors')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.vendors)).toBe(true);
  });

  // Test getting a specific vendor
  it('should get a specific vendor by ID', async () => {
    const response = await request(API_BASE)
      .get(`/vendors/${vendorId}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(vendorId);
    expect(response.body.data).toHaveProperty('businessName');
    expect(response.body.data).toHaveProperty('description');
  });

  // Test updating a vendor
  it('should update vendor details', async () => {
    const updateData = {
      businessName: 'Updated Catering Business',
      pricing: 200
    };

    const response = await request(API_BASE)
      .put(`/vendors/${vendorId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send(updateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.businessName).toBe(updateData.businessName);
    expect(response.body.data.pricing).toBe(updateData.pricing);
  });

  // Test vendor search functionality
  it('should search vendors by category', async () => {
    const response = await request(API_BASE)
      .get('/vendors')
      .query({ category: 'Catering' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.vendors)).toBe(true);
    
    // All vendors in response should have the specified category
    if (response.body.data.vendors.length > 0) {
      response.body.data.vendors.forEach((vendor: any) => {
        expect(vendor.category.toLowerCase()).toContain('catering');
      });
    }
  });

  // Test vendor creation with invalid data
  it('should fail to create vendor with invalid data', async () => {
    const invalidVendorData = {
      businessName: '', // Invalid: empty
      description: 'Test description',
      category: 'Catering',
      pricing: -50, // Invalid: negative
      location: 'NY' // Too short
    };

    const response = await request(API_BASE)
      .post('/vendors')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidVendorData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });
});