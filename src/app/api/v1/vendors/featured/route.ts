import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/vendors/featured - Get featured vendors
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // In a real implementation, this would fetch featured vendors from the database
    // Featured vendors might be those who paid for featured listings or are top-rated
    // For now, let's return vendors that are highly rated and have featured listings
    
    // This endpoint doesn't require authentication as it's for public discovery
    const featuredVendors = await VendorService.getFeaturedVendors({
      category,
      location,
      limit
    });
    
    return createApiResponse(featuredVendors, 'Featured vendors retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/vendors/featured');
  }
}