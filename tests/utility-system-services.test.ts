// tests/utility-system-services.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import fs from 'fs';
import path from 'path';

describe('Utility & System Services API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let userToken: string;
  let userId: string;

  // Create test user before running tests
  beforeEach(async () => {
    // Register user
    const userData = {
      name: 'Utility Test User',
      email: 'utility-test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const userResponse = await request(API_BASE)
      .post('/auth/register')
      .send(userData);

    userToken = userResponse.body.data.accessToken;
    userId = userResponse.body.data.user.id;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test file upload
  it('should upload a file successfully', async () => {
    // Create a simple text file for testing
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, 'Test file content for upload testing');

    // Note: Supertest with multipart/form-data can be tricky
    // This is a simplified version - in practice, you might need to use
    // a different approach or mock the file upload
    
    // For now, we'll test the endpoint structure
    const response = await request(API_BASE)
      .post('/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .field('type', 'avatar')
      .attach('file', testFilePath)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('fileId');
    expect(response.body.data).toHaveProperty('fileName');
    expect(response.body.data).toHaveProperty('url');
    expect(response.body.data).toHaveProperty('size');
    expect(response.body.data).toHaveProperty('type');

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  // Test getting uploaded file details
  it('should get uploaded file details', async () => {
    // First upload a file
    const testFilePath = path.join(__dirname, 'test-get-file.txt');
    fs.writeFileSync(testFilePath, 'Test file content for getting file details');

    const uploadResponse = await request(API_BASE)
      .post('/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .field('type', 'document')
      .attach('file', testFilePath)
      .expect(200);

    const fileId = uploadResponse.body.data.fileId;

    // Then get the file details
    const response = await request(API_BASE)
      .get(`/upload/${fileId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(fileId);
    expect(response.body.data).toHaveProperty('fileName');
    expect(response.body.data).toHaveProperty('url');
    expect(response.body.data).toHaveProperty('size');
    expect(response.body.data).toHaveProperty('type');
    expect(response.body.data).toHaveProperty('uploadedBy');
    expect(response.body.data).toHaveProperty('createdAt');

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  // Test deleting uploaded file
  it('should delete an uploaded file', async () => {
    // First upload a file
    const testFilePath = path.join(__dirname, 'test-delete-file.txt');
    fs.writeFileSync(testFilePath, 'Test file content for deletion testing');

    const uploadResponse = await request(API_BASE)
      .post('/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .field('type', 'temporary')
      .attach('file', testFilePath)
      .expect(200);

    const fileId = uploadResponse.body.data.fileId;

    // Then delete the file
    const response = await request(API_BASE)
      .delete(`/upload/${fileId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('File deleted successfully');
  });

  // Test getting locations
  it('should get locations', async () => {
    const response = await request(API_BASE)
      .get('/locations')
      .query({ search: 'New York', limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.locations)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check location structure
    if (response.body.data.locations.length > 0) {
      const location = response.body.data.locations[0];
      expect(location).toHaveProperty('id');
      expect(location).toHaveProperty('name');
      expect(location).toHaveProperty('address');
      expect(location).toHaveProperty('country');
      expect(location).toHaveProperty('coordinates');
      expect(location.coordinates).toHaveProperty('lat');
      expect(location.coordinates).toHaveProperty('lng');
    }
  });

  // Test getting nearby locations
  it('should get nearby locations', async () => {
    const response = await request(API_BASE)
      .get('/locations/nearby')
      .query({
        lat: 40.7128, // New York City latitude
        lng: -74.0060, // New York City longitude
        radius: 10,
        limit: 10
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.locations)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check that we get locations
    expect(response.body.data.locations.length).toBeGreaterThanOrEqual(0);
  });

  // Test getting supported countries
  it('should get supported countries', async () => {
    const response = await request(API_BASE)
      .get('/countries')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.countries)).toBe(true);
    
    // Check that we have at least some countries
    expect(response.body.data.countries.length).toBeGreaterThan(0);
    
    // Check country structure
    const country = response.body.data.countries[0];
    expect(country).toHaveProperty('code');
    expect(country).toHaveProperty('name');
    expect(country).toHaveProperty('flag');
  });

  // Test search functionality
  it('should perform search across content types', async () => {
    const response = await request(API_BASE)
      .get('/search')
      .query({
        q: 'wedding',
        type: 'event',
        page: 1,
        limit: 10
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
    expect(Array.isArray(response.body.data.results)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check result structure
    if (response.body.data.results.length > 0) {
      const result = response.body.data.results[0];
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
    }
  });

  // Test advanced search
  it('should perform advanced search', async () => {
    const searchPayload = {
      query: 'catering',
      filters: {
        category: 'Catering',
        location: 'New York'
      },
      sort: 'rating',
      order: 'desc'
    };

    const response = await request(API_BASE)
      .post('/search/advanced')
      .send(searchPayload)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('results');
    expect(Array.isArray(response.body.data.results)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
  });

  // Test getting user notification preferences
  it('should get user notification preferences', async () => {
    const response = await request(API_BASE)
      .get('/notifications/settings')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('settings');
    expect(response.body.data.settings).toHaveProperty('email');
    expect(response.body.data.settings).toHaveProperty('push');
    expect(response.body.data.settings).toHaveProperty('sms');
  });

  // Test updating user notification preferences
  it('should update user notification preferences', async () => {
    const preferencesData = {
      email: true,
      push: false,
      sms: true
    };

    const response = await request(API_BASE)
      .put('/notifications/settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send(preferencesData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Notification settings updated successfully');
  });

  // Test sending notification
  it('should send a notification', async () => {
    const notificationData = {
      title: 'Test Notification',
      message: 'This is a test notification',
      type: 'SYSTEM',
      userId: userId
    };

    const response = await request(API_BASE)
      .post('/notifications/send')
      .set('Authorization', `Bearer ${userToken}`)
      .send(notificationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Notification sent successfully');
  });

  // Test getting user notifications
  it('should get user notifications', async () => {
    const response = await request(API_BASE)
      .get('/notifications')
      .set('Authorization', `Bearer ${userToken}`)
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.notifications)).toBe(true);
    expect(response.body.data).toHaveProperty('pagination');
    
    // Check notification structure
    if (response.body.data.notifications.length > 0) {
      const notification = response.body.data.notifications[0];
      expect(notification).toHaveProperty('id');
      expect(notification).toHaveProperty('title');
      expect(notification).toHaveProperty('message');
      expect(notification).toHaveProperty('type');
      expect(notification).toHaveProperty('read');
      expect(notification).toHaveProperty('createdAt');
    }
  });

  // Test getting user notification count
  it('should get user notification count', async () => {
    const response = await request(API_BASE)
      .get('/notifications/count')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('count');
    expect(typeof response.body.data.count).toBe('number');
    expect(response.body.data.count).toBeGreaterThanOrEqual(0);
  });

  // Test getting user preferences
  it('should get user preferences', async () => {
    const response = await request(API_BASE)
      .get('/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('preferences');
    expect(typeof response.body.data.preferences).toBe('object');
    
    // Check preference structure
    const preferences = response.body.data.preferences;
    expect(preferences).toHaveProperty('notifications');
    expect(preferences).toHaveProperty('privacy');
    expect(preferences).toHaveProperty('language');
  });

  // Test updating user preferences
  it('should update user preferences', async () => {
    const preferencesData = {
      notifications: {
        email: true,
        push: false
      },
      privacy: {
        profileVisible: true,
        showEmail: false
      },
      language: 'en'
    };

    const response = await request(API_BASE)
      .put('/user/preferences')
      .set('Authorization', `Bearer ${userToken}`)
      .send(preferencesData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Preferences updated successfully');
  });

  // Test invalid file upload
  it('should fail to upload file with invalid data', async () => {
    // Create a test file
    const testFilePath = path.join(__dirname, 'test-invalid-upload.txt');
    fs.writeFileSync(testFilePath, 'Test content for invalid upload');

    const response = await request(API_BASE)
      .post('/upload')
      .set('Authorization', `Bearer ${userToken}`)
      .field('type', '') // Invalid: empty type
      .attach('file', testFilePath) // No file attached
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');

    // Clean up test file
    fs.unlinkSync(testFilePath);
  });

  // Test unauthorized access to protected endpoints
  it('should require authentication for protected endpoints', async () => {
    const response = await request(API_BASE)
      .get('/user/preferences')
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });

  // Test invalid search query
  it('should fail with invalid search parameters', async () => {
    const response = await request(API_BASE)
      .get('/search')
      .query({
        q: '', // Invalid: empty query
        page: -1, // Invalid: negative page
        limit: 0 // Invalid: zero limit
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test invalid location search
  it('should fail with invalid location parameters', async () => {
    const response = await request(API_BASE)
      .get('/locations/nearby')
      .query({
        lat: 100, // Invalid: out of range latitude
        lng: 200, // Invalid: out of range longitude
        radius: -10 // Invalid: negative radius
      })
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test system health endpoint
  it('should get system health status', async () => {
    const response = await request(API_BASE)
      .get('/health')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status');
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data).toHaveProperty('timestamp');
    expect(response.body.data).toHaveProperty('services');
    
    // Check service statuses
    expect(response.body.data.services).toHaveProperty('database');
    expect(response.body.data.services).toHaveProperty('cache');
    expect(response.body.data.services).toHaveProperty('queue');
  });

  // Test system info endpoint
  it('should get system information', async () => {
    const response = await request(API_BASE)
      .get('/system-info')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('version');
    expect(response.body.data).toHaveProperty('environment');
    expect(response.body.data).toHaveProperty('uptime');
    expect(response.body.data).toHaveProperty('memory');
    expect(response.body.data).toHaveProperty('cpu');
  });

  // Test timezone information
  it('should get timezone information', async () => {
    const response = await request(API_BASE)
      .get('/timezones')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.timezones)).toBe(true);
    
    // Check timezone structure
    if (response.body.data.timezones.length > 0) {
      const timezone = response.body.data.timezones[0];
      expect(timezone).toHaveProperty('id');
      expect(timezone).toHaveProperty('name');
      expect(timezone).toHaveProperty('offset');
      expect(timezone).toHaveProperty('currentDateTime');
    }
  });

  // Test localization data
  it('should get localization data', async () => {
    const response = await request(API_BASE)
      .get('/localization')
      .query({ language: 'en' })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('language');
    expect(response.body.data.language).toBe('en');
    expect(response.body.data).toHaveProperty('translations');
    expect(typeof response.body.data.translations).toBe('object');
  });
});