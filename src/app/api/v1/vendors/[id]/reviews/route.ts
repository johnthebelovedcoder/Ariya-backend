import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { ReviewService } from '@/lib/review-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/vendors/[vendorId]/reviews - Get vendor reviews
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    // This endpoint can be public - anyone can view vendor reviews
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const minRating = searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined;
    
    // Get vendor reviews with pagination
    const reviews = await ReviewService.getVendorReviews(vendorId, page, limit, minRating);
    
    return createApiResponse(reviews, 'Vendor reviews retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendors/[vendorId]/reviews');
  }
}

// POST /api/vendors/[vendorId]/reviews - Submit review (post-event)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify vendor exists
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['rating', 'comment'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate rating
    if (typeof body.rating !== 'number' || body.rating < 1 || body.rating > 5) {
      return createApiError('Rating must be between 1 and 5', 400);
    }
    
    if (typeof body.comment !== 'string' || body.comment.trim().length === 0) {
      return createApiError('Comment is required and cannot be empty', 400);
    }
    
    // In a real implementation, we would verify that the user has booked this vendor
    // For now, we'll create the review directly
    const review = await ReviewService.createReview({
      vendorId: vendorId,
      userId: user.id,
      rating: body.rating,
      comment: body.comment
    });
    
    return createApiResponse(review, 'Review submitted successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/vendors/[vendorId]/reviews');
  }
}