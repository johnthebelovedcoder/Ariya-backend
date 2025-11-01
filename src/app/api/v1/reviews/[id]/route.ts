import { NextRequest } from 'next/server';
import { ReviewService } from '@/lib/review-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/reviews/[id] - Get a specific review by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return createApiError('Review ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const review = await ReviewService.getReviewById(id, user.id);
    
    if (!review) {
      return createApiError('Review not found', 404);
    }
    
    return createApiResponse(review, 'Review retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/reviews/[id]');
  }
}

// PUT /api/reviews/[id] - Update a review by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return createApiError('Review ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate rating if provided
    if (body.rating !== undefined) {
      if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
        return createApiError('Rating must be a number between 1 and 5', 400);
      }
    }
    
    const review = await ReviewService.updateReview(id, user.id, {
      rating: body.rating,
      comment: body.comment,
    });
    
    return createApiResponse(review, 'Review updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/reviews/[id]');
  }
}

// DELETE /api/reviews/[id] - Delete a review by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return createApiError('Review ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    await ReviewService.deleteReview(id, user.id);
    
    return createApiResponse(null, 'Review deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/reviews/[id]');
  }
}