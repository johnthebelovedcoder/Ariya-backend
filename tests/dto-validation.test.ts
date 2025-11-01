// tests/dto-validation.test.ts
import { describe, it, expect } from 'vitest';
import { 
  validateCreateUserRequest, 
  validateUpdateUserRequest, 
  validateCreateEventRequest, 
  validateCreateBookingRequest 
} from '../src/lib/dto-validation';

describe('DTO Validation Tests', () => {
  describe('validateCreateUserRequest', () => {
    it('should return valid for correct user data', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'SecurePassword123!',
      };
      
      const result = validateCreateUserRequest(userData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should return invalid for missing required fields', () => {
      const userData = {
        name: 'John Doe',
        // Missing email and password
      };
      
      const result = validateCreateUserRequest(userData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('email is required');
      expect(result.errors).toContain('password is required');
    });
    
    it('should return invalid for invalid email format', () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'SecurePassword123!',
      };
      
      const result = validateCreateUserRequest(userData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format for email');
    });
    
    it('should return invalid for weak password', () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
      };
      
      const result = validateCreateUserRequest(userData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters long');
    });
  });
  
  describe('validateUpdateUserRequest', () => {
    it('should return valid for correct update data', () => {
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com',
      };
      
      const result = validateUpdateUserRequest(updateData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should return valid for partial update data', () => {
      const updateData = {
        name: 'Jane Doe',
        // Only updating name
      };
      
      const result = validateUpdateUserRequest(updateData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should return invalid for invalid email format', () => {
      const updateData = {
        email: 'invalid-email',
      };
      
      const result = validateUpdateUserRequest(updateData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid email format');
    });
  });
  
  describe('validateCreateEventRequest', () => {
    it('should return valid for correct event data', () => {
      const eventData = {
        name: 'My Wedding',
        type: 'Wedding',
        date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        location: 'Central Park, NY',
        budget: 10000,
      };
      
      const result = validateCreateEventRequest(eventData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should return invalid for missing required fields', () => {
      const eventData = {
        name: 'My Wedding',
        // Missing other required fields
      };
      
      const result = validateCreateEventRequest(eventData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('type is required');
      expect(result.errors).toContain('date is required');
      expect(result.errors).toContain('location is required');
      expect(result.errors).toContain('budget is required');
    });
    
    it('should return invalid for past date', () => {
      const eventData = {
        name: 'My Wedding',
        type: 'Wedding',
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        location: 'Central Park, NY',
        budget: 10000,
      };
      
      const result = validateCreateEventRequest(eventData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Event date must be today or in the future');
    });
  });
  
  describe('validateCreateBookingRequest', () => {
    it('should return valid for correct booking data', () => {
      const bookingData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        vendorId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 5000,
      };
      
      const result = validateCreateBookingRequest(bookingData);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    it('should return invalid for invalid UUID format', () => {
      const bookingData = {
        eventId: 'invalid-uuid',
        vendorId: '123e4567-e89b-12d3-a456-426614174001',
        amount: 5000,
      };
      
      const result = validateCreateBookingRequest(bookingData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid event ID format');
    });
    
    it('should return invalid for invalid amount', () => {
      const bookingData = {
        eventId: '123e4567-e89b-12d3-a456-426614174000',
        vendorId: '123e4567-e89b-12d3-a456-426614174001',
        amount: -100,
      };
      
      const result = validateCreateBookingRequest(bookingData);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be greater than 0');
    });
  });
});