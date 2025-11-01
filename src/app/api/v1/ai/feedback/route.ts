import { NextRequest } from 'next/server';
import { EnhancedAIService } from '@/lib/enhanced-ai-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/ai/feedback - Submit feedback on AI recommendations
export async function POST(request: NextRequest) {
  try {
    await requireAuthApi();
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['recommendationId', 'rating'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required for AI feedback`, 400);
      }
    }
    
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return createApiError('rating must be a number between 1 and 5', 400);
    }
    
    const feedbackResult = await EnhancedAIService.submitFeedback({
      recommendationId: body.recommendationId,
      rating: body.rating,
      comment: body.comment,
      improvementSuggestions: body.improvementSuggestions
    });
    
    return createApiResponse(feedbackResult, 'Feedback submitted successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/ai/feedback');
  }
}