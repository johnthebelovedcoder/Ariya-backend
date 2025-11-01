import { NextRequest } from 'next/server';
import { AIRecommendationService } from '@/lib/ai-recommendation-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/ai/recommendations - Get AI recommendations for an event
export async function GET(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');
    
    // Validate parameters
    if (!eventId) {
      return createApiError('eventId is required', 400);
    }
    
    const recommendations = await AIRecommendationService.getEventRecommendations(eventId, user.id);
    
    return createApiResponse(recommendations, 'AI Recommendations retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving AI recommendations:', error);
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to access it') {
      return createApiError(error.message, 404);
    }
    
    return createApiError('Failed to retrieve AI recommendations', 500);
  }
}

// POST /api/ai/recommendations - Create or generate AI recommendations for an event
export async function POST(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Check if we're generating recommendations based on event details
    if (body.generate && body.eventId) {
      const recommendations = await AIRecommendationService.generateRecommendationsForEvent(
        body.eventId, 
        user.id
      );
      
      return createApiResponse(recommendations, 'AI Recommendations generated successfully', 201);
    } else {
      // Validate required fields for manual creation
      const requiredFields = ['eventId', 'recommendations'];
      for (const field of requiredFields) {
        if (!body[field]) {
          return createApiError(`${field} is required`, 400);
        }
      }
      
      const recommendation = await AIRecommendationService.createRecommendations({
        eventId: body.eventId,
        recommendations: body.recommendations,
        feedback: body.feedback,
      }, user.id);
      
      return createApiResponse(recommendation, 'AI Recommendation created successfully', 201);
    }
  } catch (error: unknown) {
    console.error('Error creating AI recommendation:', error);
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to add recommendations to it') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'Event not found or you do not have permission to generate recommendations for it') {
      return createApiError(error.message, 404);
    }
    
    return createApiError('Failed to create AI recommendation', 500);
  }
}