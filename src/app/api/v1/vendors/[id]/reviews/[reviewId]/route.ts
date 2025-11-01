import { NextRequest } from 'next/server';
import { ReviewService } from '@/lib/review-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract review ID from URL
function getReviewIdFromUrl(url: string): string | null {
  // Extract reviewId from URL - pattern: /api/vendors/[vendorId]/reviews/[reviewId]
  const match = url.match(/\/api\/vendors\/[^\/]+\/reviews\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// PUT /api/vendors/[vendorId]/reviews/[reviewId] - Update review
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    const reviewId = getReviewIdFromUrl(request.url);
    
    if (!vendorId || !reviewId) {
      return createApiError('Vendor ID and Review ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify this is the review author
    const review = await ReviewService.getReviewById(reviewId);
    if (!review || review.userId !== user.id) {
      return createApiError('You do not have permission to update this review', 403);
    }
    
    const body = await request.json();
    
    // Validate update data
    if (body.rating !== undefined) {
      if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
        return createApiError('Rating must be between 1 and 5', 400);
      }
    }
    
    if (body.comment !== undefined) {
      if (typeof body.comment !== 'string' || body.comment.trim().length === 0) {
        return createApiError('Comment cannot be empty', 400);
      }
    }
    
    // Update the review
    const updatedReview = await ReviewService.updateReview(reviewId, user.id, {
      rating: body.rating,
      comment: body.comment
    });
    
    return createApiResponse(updatedReview, 'Review updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/vendors/[vendorId]/reviews/[reviewId]');
  }
}

// DELETE /api/vendors/[vendorId]/reviews/[reviewId] - Delete review
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    const reviewId = getReviewIdFromUrl(request.url);
    
    if (!vendorId || !reviewId) {
      return createApiError('Vendor ID and Review ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify this is the review author or an admin
    const review = await ReviewService.getReviewById(reviewId);
    if (!review) {
      return createApiError('Review not found', 404);
    }
    
    const isAuthor = review.userId === user.id;
    const isAdmin = user.role === 'ADMIN';
    
    if (!isAuthor && !isAdmin) {
      return createApiError('You do not have permission to delete this review', 403);
    }
    
    // Delete the review
    await ReviewService.deleteReview(reviewId, user.id);
    
    return createApiResponse(null, 'Review deleted successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/vendors/[vendorId]/reviews/[reviewId]');
  }
}