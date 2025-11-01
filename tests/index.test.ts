// tests/index.test.ts
import { describe, it, expect } from 'vitest';

// Import all test suites
import './auth.test';
import './vendors.test';
import './bookings.test';
import './events.test';
import './messaging.test';
import './event-website-registry.test';
import './ai-planning-assistant.test';
import './payment-monetization.test';
import './admin-management.test';
import './utility-system-services.test';

describe('Complete Test Suite', () => {
  it('should have all test files imported correctly', () => {
    // This is just a placeholder test to ensure all test files are imported
    expect(true).toBe(true);
  });
});