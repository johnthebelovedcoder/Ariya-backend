import { NextRequest } from 'next/server';
import { AIRecommendationService } from '@/lib/ai-recommendation-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/ai/recommendations/[id] - Get AI recommendation by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Recommendation ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const recommendation = await AIRecommendationService.getRecommendationById(id, user.id);
    
    if (!recommendation) {
      return createApiError('Recommendation not found or you do not have permission to access it', 404);
    }
    
    return createApiResponse(recommendation, 'Recommendation retrieved successfully');
  } catch (error: unknown) {
    console.error('Error retrieving recommendation:', error);
    return createApiError('Failed to retrieve recommendation', 500);
  }
}

// PUT /api/ai/recommendations/[id] - Update AI recommendation by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Recommendation ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    const recommendation = await AIRecommendationService.updateRecommendation(id, user.id, {
      recommendations: body.recommendations,
      feedback: body.feedback,
    });
    
    return createApiResponse(recommendation, 'Recommendation updated successfully');
  } catch (error: unknown) {
    console.error('Error updating recommendation:', error);
    
    if (error instanceof Error && error.message === 'Recommendation not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'You do not have permission to update this recommendation') {
      return createApiError(error.message, 403);
    }
    
    return createApiError('Failed to update recommendation', 500);
  }
}

// DELETE /api/ai/recommendations/[id] - Delete AI recommendation by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { id } = params;
  
  if (!id) {
    return createApiError('Recommendation ID is required', 400);
  }
  
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    await AIRecommendationService.deleteRecommendation(id, user.id);
    
    return createApiResponse(null, 'Recommendation deleted successfully');
  } catch (error: unknown) {
    console.error('Error deleting recommendation:', error);
    
    if (error instanceof Error && error.message === 'Recommendation not found') {
      return createApiError(error.message, 404);
    }
    
    if (error instanceof Error && error.message === 'You do not have permission to delete this recommendation') {
      return createApiError(error.message, 403);
    }
    
    return createApiError('Failed to delete recommendation', 500);
  }
}