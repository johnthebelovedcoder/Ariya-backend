import { NextRequest } from 'next/server';
import { ReviewService } from '@/lib/review-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/reviews - Get reviews with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId');
    const userId = searchParams.get('userId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    // Require authentication to access reviews
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    let result;
    
    if (vendorId) {
      // Get reviews for a specific vendor
      result = await ReviewService.getVendorReviews(vendorId, page, limit);
    } else if (userId) {
      // Get reviews written by a specific user
      result = await ReviewService.getUserReviews(userId, page, limit);
    } else {
      return createApiError('Either vendorId or userId is required', 400);
    }
    
    return createApiResponse(result, 'Reviews retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/reviews');
  }
}

// POST /api/reviews - Create a new review
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['vendorId', 'userId', 'rating'];
    for (const field of requiredFields) {
      if (body[field] === undefined || body[field] === null) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate that the user creating the review is the same as the one in the body
    if (body.userId !== user.id) {
      return createApiError('You can only submit reviews for yourself', 400);
    }
    
    // Validate rating is a number between 1 and 5
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return createApiError('Rating must be a number between 1 and 5', 400);
    }
    
    const review = await ReviewService.createReview({
      vendorId: body.vendorId,
      userId: body.userId,
      rating: body.rating,
      comment: body.comment,
    }, user.id);
    
    return createApiResponse(review, 'Review created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/reviews');
  }
}