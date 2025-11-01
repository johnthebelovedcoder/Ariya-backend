// tests/ai-planning-assistant.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';

describe('AI Planning Assistant API', () => {
  const API_BASE = 'http://localhost:3000/api';
  let plannerToken: string;
  let eventId: string;

  // Create test user and event before running tests
  beforeEach(async () => {
    // Register planner user
    const plannerData = {
      name: 'AI Planning Test User',
      email: 'ai-planning-test@example.com',
      password: 'TestPass123!',
      role: 'PLANNER'
    };

    const plannerResponse = await request(API_BASE)
      .post('/auth/register')
      .send(plannerData);

    plannerToken = plannerResponse.body.data.accessToken;

    // Create an event
    const eventData = {
      name: 'AI Planning Test Event',
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

  // Test AI status endpoint
  it('should get AI service status', async () => {
    const response = await request(API_BASE)
      .get('/ai')
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('status');
    expect(['online', 'offline', 'degraded']).toContain(response.body.data.status);
  });

  // Test AI budget allocation
  it('should provide AI budget allocation recommendations', async () => {
    const budgetData = {
      budget: 15000,
      eventType: 'Wedding',
      preferences: {
        catering: 0.4,
        venue: 0.25,
        decor: 0.2,
        entertainment: 0.15
      }
    };

    const response = await request(API_BASE)
      .post('/ai/budget-allocate')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(budgetData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('allocation');
    expect(typeof response.body.data.allocation).toBe('object');
    
    // Check that allocations match the input
    expect(response.body.data.allocation).toHaveProperty('catering');
    expect(response.body.data.allocation).toHaveProperty('venue');
    expect(response.body.data.allocation).toHaveProperty('decor');
    expect(response.body.data.allocation).toHaveProperty('entertainment');
  });

  // Test AI budget estimation
  it('should estimate event budget', async () => {
    const estimateData = {
      eventType: 'Wedding',
      guestCount: 150,
      location: 'New York, NY',
      preferences: {
        style: 'luxury',
        season: 'summer'
      }
    };

    const response = await request(API_BASE)
      .post('/ai/budget-estimate')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(estimateData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('estimatedBudget');
    expect(typeof response.body.data.estimatedBudget).toBe('number');
    expect(response.body.data.estimatedBudget).toBeGreaterThan(0);
  });

  // Test AI vendor recommendations
  it('should generate vendor recommendations', async () => {
    const recommendationData = {
      eventId: eventId,
      category: 'catering',
      budget: 5000,
      preferences: {
        cuisine: 'italian',
        dietaryOptions: ['vegetarian', 'gluten-free']
      }
    };

    const response = await request(API_BASE)
      .post('/ai/recommendations')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(recommendationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.recommendations)).toBe(true);
    
    // Check recommendation structure
    if (response.body.data.recommendations.length > 0) {
      expect(response.body.data.recommendations[0]).toHaveProperty('vendorId');
      expect(response.body.data.recommendations[0]).toHaveProperty('reason');
    }
  });

  // Test AI cost savings tips
  it('should provide cost savings tips', async () => {
    const costSavingsData = {
      eventType: 'Wedding',
      budget: 15000,
      currentExpenses: {
        catering: 6000,
        venue: 4000,
        decor: 3000,
        entertainment: 2000
      }
    };

    const response = await request(API_BASE)
      .post('/ai/cost-savings-tips')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(costSavingsData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.tips)).toBe(true);
    
    if (response.body.data.tips.length > 0) {
      expect(typeof response.body.data.tips[0]).toBe('string');
    }
  });

  // Test AI event themes
  it('should suggest event themes', async () => {
    const themeData = {
      eventType: 'wedding',
      preferences: {
        style: 'modern',
        colors: ['gold', 'white']
      }
    };

    const response = await request(API_BASE)
      .post('/ai/event-themes')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(themeData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.themes)).toBe(true);
    
    if (response.body.data.themes.length > 0) {
      expect(typeof response.body.data.themes[0]).toBe('string');
    }
  });

  // Test AI budget reallocation
  it('should reallocate budget based on priorities', async () => {
    const reallocationData = {
      currentAllocation: {
        catering: 6000,
        venue: 4000,
        decor: 3000,
        entertainment: 2000
      },
      eventType: 'Wedding',
      newPreferences: {
        priority: 'catering' // Now prioritizing catering
      }
    };

    const response = await request(API_BASE)
      .post('/ai/budget-reallocate')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(reallocationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('reallocations');
    expect(typeof response.body.data.reallocations).toBe('object');
  });

  // Test AI feedback submission
  it('should accept feedback on AI recommendations', async () => {
    // First, get a recommendation
    const recommendationData = {
      eventId: eventId,
      category: 'catering',
      budget: 5000
    };

    const recResponse = await request(API_BASE)
      .post('/ai/recommendations')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(recommendationData)
      .expect(200);

    // Submit feedback on the recommendation
    const feedbackData = {
      feedback: 'This recommendation was very helpful',
      recommendationId: recResponse.body.data.recommendations[0]?.vendorId || 'test-id',
      rating: 5,
      helpful: true
    };

    const response = await request(API_BASE)
      .post('/ai/feedback')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(feedbackData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Feedback submitted successfully');
  });

  // Test AI vendor alternatives
  it('should suggest vendor alternatives', async () => {
    const alternativeData = {
      vendorId: 'test-vendor-id',
      eventType: 'wedding',
      budget: 5000
    };

    const response = await request(API_BASE)
      .post('/ai/vendor-alternatives')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(alternativeData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data.alternatives)).toBe(true);
    
    if (response.body.data.alternatives.length > 0) {
      expect(response.body.data.alternatives[0]).toHaveProperty('vendorId');
      expect(response.body.data.alternatives[0]).toHaveProperty('name');
    }
  });

  // Test AI vendor lock for recommendations
  it('should lock vendor recommendations', async () => {
    const lockData = {
      eventId: eventId,
      vendorRecommendations: [
        {
          vendorId: 'locked-vendor-id',
          reason: 'Recommended by AI'
        }
      ]
    };

    const response = await request(API_BASE)
      .post('/ai/vendor-lock')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(lockData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Vendor recommendations locked successfully');
  });

  // Test AI budget breakdown
  it('should provide budget breakdown', async () => {
    const breakdownData = {
      budget: 15000,
      eventType: 'wedding',
      categories: ['catering', 'venue', 'decor', 'entertainment']
    };

    const response = await request(API_BASE)
      .post('/ai/budget-breakdown')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(breakdownData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('breakdown');
    expect(typeof response.body.data.breakdown).toBe('object');
  });

  // Test AI budget optimization
  it('should optimize budget allocation', async () => {
    const optimizationData = {
      eventType: 'wedding',
      budget: 15000,
      preferences: {
        priority: 'value',
        constraints: {
          minimumQuality: 'high'
        }
      }
    };

    const response = await request(API_BASE)
      .post('/ai/optimize-budget')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(optimizationData)
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('optimizedAllocation');
    expect(typeof response.body.data.optimizedAllocation).toBe('object');
  });

  // Test invalid AI budget allocation input
  it('should fail with invalid budget allocation input', async () => {
    const invalidData = {
      budget: -1000, // Invalid: negative budget
      eventType: '', // Invalid: empty event type
    };

    const response = await request(API_BASE)
      .post('/ai/budget-allocate')
      .set('Authorization', `Bearer ${plannerToken}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Validation failed');
  });

  // Test unauthorized access to AI endpoints
  it('should require authentication for AI endpoints', async () => {
    const testData = {
      budget: 10000,
      eventType: 'wedding'
    };

    const response = await request(API_BASE)
      .post('/ai/budget-allocate')
      .send(testData)
      .expect(401);

    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });
});