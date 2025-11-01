// tests/auth.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { UserService } from '@/lib/user-service';

// Mock the Next.js app
const mockApp = {
  // This would be a more complex setup in a real scenario
  // For now we'll test individual API route functions directly
};

describe('Authentication API', () => {
  const API_BASE = 'http://localhost:3000/api';

  // Mock authentication service and user service for testing
  beforeEach(() => {
    // Setup any mocks needed for the tests
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Cleanup after each test
    vi.resetAllMocks();
  });

  // Test user registration
  it('should register a new user successfully', async () => {
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const response = await request(API_BASE)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.user.email).toBe(userData.email.toLowerCase());
    expect(response.body.data.user.name).toBe(userData.name);
  });

  // Test user registration with invalid data
  it('should fail to register user with invalid data', async () => {
    const invalidUserData = {
      name: '', // Invalid: empty name
      email: 'invalid-email', // Invalid: not an email
      password: '123', // Invalid: too short
      role: 'INVALID_ROLE' // Invalid: role
    };

    const response = await request(API_BASE)
      .post('/auth/register')
      .send(invalidUserData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test user login
  it('should login user with valid credentials', async () => {
    // First register a user
    const userData = {
      name: 'Login Test User',
      email: 'login-test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    await request(API_BASE)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    // Then try to login
    const loginData = {
      email: 'login-test@example.com',
      password: 'TestPass123!'
    };

    const response = await request(API_BASE)
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('user');
    expect(response.body.data).toHaveProperty('accessToken');
    expect(response.body.data.user.email).toBe(loginData.email.toLowerCase());
  });

  // Test user login with invalid credentials
  it('should fail to login with invalid credentials', async () => {
    const loginData = {
      email: 'nonexistent@example.com',
      password: 'wrongpassword'
    };

    const response = await request(API_BASE)
      .post('/auth/login')
      .send(loginData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('Invalid email or password');
  });

  // Test user registration with duplicate email
  it('should fail to register user with existing email', async () => {
    const userData = {
      name: 'Duplicate User',
      email: 'duplicate@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    // Register user first time
    await request(API_BASE)
      .post('/auth/register')
      .send(userData)
      .expect(201);

    // Try to register with same email
    const response = await request(API_BASE)
      .post('/auth/register')
      .send(userData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toBe('A user with this email already exists');
  });
});