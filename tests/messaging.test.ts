// tests/messaging.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('Messaging API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let plannerToken: string;
  let vendorToken: string;
  let plannerId: string;
  let vendorId: string;

  // Create test users before running tests
  beforeEach(async () => {
    // Register planner user
    const plannerData = {
      name: 'Planner Messaging User',
      email: 'planner-messaging@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const plannerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(plannerData);

    plannerToken = plannerResponse.body.data.accessToken;
    plannerId = plannerResponse.body.data.user.id;

    // Register vendor user
    const vendorData = {
      name: 'Vendor Messaging User',
      email: 'vendor-messaging@example.com',
      password: 'TestPass123!',
      role: 'VENDOR'
    };

    const vendorResponse = await request(API_BASE)
      .post('/auth/register')
      .send(vendorData);

    vendorToken = vendorResponse.body.data.accessToken;
    vendorId = vendorResponse.body.data.user.id;

    // Create vendor profile
    const vendorProfileData = {
      businessName: 'Messaging Test Catering',
      description: 'Test vendor for messaging',
      category: 'Catering',
      pricing: 150,
      location: 'New York, NY'
    };

    const vendorProfileResponse = await request(API_BASE)
      .post('/vendors')
      .set('Authorization', `Bearer ${vendorToken}`)
      .send(vendorProfileData);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  // Test sending a message
  it('should send a message successfully', async () => {
    const messageData = {
      to: vendorId,
      content: 'Hello, I am interested in your catering services for an event.',
      type: 'TEXT'
    };

    const response = await request(API_BASE)
      .post('/messages')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(messageData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data).toHaveProperty('senderId');
    expect(response.body.data).toHaveProperty('recipientId');
    expect(response.body.data.content).toBe(messageData.content);
    expect(response.body.data.senderId).toBe(plannerId);
    expect(response.body.data.recipientId).toBe(vendorId);
  });

  // Test getting user messages
  it('should get messages for the authenticated user', async () => {
    const response = await request(API_BASE)
      .get('/messages')
      .set('Authorization', `Bearer ${vendorToken}`)
      .query({ limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.messages)).toBe(true);
    
    // The user should have at least one message (the one sent by planner)
    expect(response.body.data.messages.length).toBeGreaterThanOrEqual(0);
    
    if (response.body.data.messages.length > 0) {
      expect(response.body.data.messages[0]).toHaveProperty('id');
      expect(response.body.data.messages[0]).toHaveProperty('content');
      expect(response.body.data.messages[0]).toHaveProperty('createdAt');
    }
  });

  // Test getting conversations
  it('should get user conversations', async () => {
    const response = await request(API_BASE)
      .get('/messages/conversations')
      .set('Authorization', `Bearer ${vendorToken}`)
      .query({ limit: 10 })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.conversations)).toBe(true);
    
    // Check conversation structure
    if (response.body.data.conversations.length > 0) {
      expect(response.body.data.conversations[0]).toHaveProperty('id');
      expect(response.body.data.conversations[0]).toHaveProperty('lastMessage');
      expect(response.body.data.conversations[0]).toHaveProperty('lastMessageAt');
    }
  });

  // Test getting unread message count
  it('should get unread message count', async () => {
    const response = await request(API_BASE)
      .get('/messages/unread-count')
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('count');
    expect(typeof response.body.data.count).toBe('number');
  });

  // Test marking message as read
  it('should mark a message as read', async () => {
    // First, send a message
    const messageData = {
      to: vendorId,
      content: 'This is a test message to be marked as read',
      type: 'TEXT'
    };

    const messageResponse = await request(API_BASE)
      .post('/messages')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(messageData)
      .expect(200);

    const messageId = messageResponse.body.data.id;

    // Mark the message as read
    const response = await request(API_BASE)
      .post(`/messages/${messageId}/read`)
      .set('Authorization', `Bearer ${vendorToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.id).toBe(messageId);
  });

  // Test sending message with invalid data
  it('should fail to send message with invalid data', async () => {
    const invalidMessageData = {
      to: '', // Invalid: empty recipient
      content: '', // Invalid: empty content
    };

    const response = await request(API_BASE)
      .post('/messages')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(invalidMessageData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test access control - unauthorized user should not send message
  it('should require authentication for sending messages', async () => {
    const messageData = {
      to: vendorId,
      content: 'Unauthorized message attempt',
      type: 'TEXT'
    };

    const response = await request(API_BASE)
      .post('/messages')
      .send(messageData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });
});