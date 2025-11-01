import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { POST as registerPOST } from '@/app/api/auth/register/route';
import { POST as locationPOST, GET as locationGET } from '@/app/api/location/route';
import { POST as profilePUT, GET as profileGET } from '@/app/api/profile/route';
import { POST as selfiePOST } from '@/app/api/upload/selfie/route';
import { POST as onboardingPOST } from '@/app/api/onboarding/route';
import { NextRequest } from 'next/server';

// Mock the necessary modules
vi.mock('@/lib/auth-service', () => ({
  AuthService: {
    register: vi.fn().mockResolvedValue({
      user: {
        id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'PLANNER',
        isVerified: false,
        createdAt: new Date(),
      },
      accessToken: 'access_token',
      refreshToken: 'refresh_token',
    }),
  },
}));

vi.mock('@/lib/api-utils', async () => {
  const actual = await vi.importActual('@/lib/api-utils');
  return {
    ...actual,
    requireAuthApi: vi.fn().mockResolvedValue({ user: { id: 'test_user_id' } }),
    createApiResponse: vi.fn((data, message, status = 200) => {
      return new Response(JSON.stringify({ success: true, message, data }), { status });
    }),
    createApiError: vi.fn((message, status = 400) => {
      return new Response(JSON.stringify({ success: false, message }), { status });
    }),
    sanitizeInput: vi.fn((input) => input),
  };
});

vi.mock('@/lib/validation', () => ({
  validateInput: vi.fn().mockReturnValue({ isValid: true }),
  isValidPassword: vi.fn().mockReturnValue(true),
}));

vi.mock('@/lib/rate-limit', () => ({
  withRateLimit: {
    auth: vi.fn().mockResolvedValue({ allowed: true }),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      update: vi.fn().mockResolvedValue({ id: 'user123', profileImage: 'https://example.com/image.jpg' }),
      findUnique: vi.fn().mockResolvedValue({ id: 'user123', name: 'John Doe', email: 'john@example.com' }),
    },
    vendor: {
      create: vi.fn().mockResolvedValue({ id: 'vendor123' }),
    },
  },
}));

describe('API Routes Tests', () => {
  describe('Registration API', () => {
    it('should register a user with first and last name', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'SecurePassword123!',
          confirmPassword: 'SecurePassword123!',
          role: 'PLANNER',
        }),
        headers: { get: () => '127.0.0.1' },
      } as unknown as NextRequest;

      const response = await registerPOST(mockRequest);
      const result = await response.json();

      expect(response.status).toBe(201);
      expect(result.success).toBe(true);
      expect(result.message).toBe('Registration successful');
    });

    it('should fail if passwords do not match', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: 'SecurePassword123!',
          confirmPassword: 'DifferentPassword123!',
          role: 'PLANNER',
        }),
        headers: { get: () => '127.0.0.1' },
      } as unknown as NextRequest;

      const response = await registerPOST(mockRequest);
      
      expect(response.status).toBe(400);
    });
  });

  describe('Location API', () => {
    it('should return countries when no country parameter is provided', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/location',
      } as unknown as NextRequest;

      const response = await locationGET(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.countries).toBeDefined();
    });

    it('should return cities for country and state', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          country: 'US',
          state: 'California',
        }),
      } as unknown as NextRequest;

      const response = await locationPOST(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.cities).toBeDefined();
    });
  });

  describe('Profile API', () => {
    it('should get user profile with separate first and last name', async () => {
      const mockRequest = {
        url: 'http://localhost:3000/api/profile',
      } as unknown as NextRequest;

      const response = await profileGET(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.firstName).toBeDefined();
      expect(result.data.lastName).toBeDefined();
    });

    it('should update user profile with separate first and last name', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
        }),
      } as unknown as NextRequest;

      const response = await profilePUT(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toBe('User profile updated successfully');
    });
  });

  describe('Selfie Upload API', () => {
    it('should upload a selfie image', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          imageUrl: 'https://example.com/selfie.jpg',
        }),
      } as unknown as NextRequest;

      const response = await selfiePOST(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.data.selfieUrl).toBe('https://example.com/selfie.jpg');
    });
  });

  describe('Onboarding API', () => {
    it('should handle vendor onboarding business info step', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          flowType: 'vendor',
          step: 'business-info',
          businessName: 'Test Business',
          category: 'Photography',
          description: 'Test business description',
          pricing: 100,
        }),
      } as unknown as NextRequest;

      const response = await onboardingPOST(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Business information saved successfully');
    });

    it('should handle planner onboarding event type step', async () => {
      const mockRequest = {
        json: () => Promise.resolve({
          flowType: 'planner',
          step: 'event-type',
          eventType: 'Wedding',
        }),
      } as unknown as NextRequest;

      const response = await onboardingPOST(mockRequest);
      const result = await response.json();

      expect(result.success).toBe(true);
      expect(result.message).toContain('Event type saved successfully');
    });
  });
});