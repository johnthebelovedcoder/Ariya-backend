import { NextRequest } from 'next/server';
import { FeaturedListingService } from '@/lib/featured-listing-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import prisma from '@/lib/prisma';

// GET /api/featured-listings - Get vendor's featured listings
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get vendor ID based on user ID
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      return createApiError('User does not have a vendor profile', 400);
    }
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    const result = await FeaturedListingService.getVendorFeaturedListings(vendor.id, page, limit);
    
    return createApiResponse(result, 'Featured listings retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/featured-listings');
  }
}

// POST /api/featured-listings - Create a new featured listing
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Check if user is a vendor
    const vendor = await prisma.vendor.findUnique({
      where: { userId: user.id }
    });
    
    if (!vendor) {
      return createApiError('User does not have a vendor profile', 400);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['type', 'amount', 'startDate', 'endDate'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate type
    const validTypes = ['CATEGORY_TOP_SPOT', 'SEARCH_RESULT_BOOST'];
    if (!validTypes.includes(body.type)) {
      return createApiError('Invalid featured listing type', 400);
    }
    
    // Validate dates
    const startDate = new Date(body.startDate);
    const endDate = new Date(body.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return createApiError('Invalid date format', 400);
    }
    
    if (endDate <= startDate) {
      return createApiError('End date must be after start date', 400);
    }
    
    // Validate amount is positive
    if (typeof body.amount !== 'number' || body.amount <= 0) {
      return createApiError('Amount must be a positive number', 400);
    }
    
    const listing = await FeaturedListingService.createFeaturedListing({
      vendorId: vendor.id,
      type: body.type,
      amount: body.amount,
      startDate,
      endDate,
      paymentStatus: body.paymentStatus,
    }, vendor.id);
    
    return createApiResponse(listing, 'Featured listing created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/featured-listings');
  }
}