import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, createApiResponse, createApiError } from '@/lib/api-utils';

// GET /api/vendors - Get all vendors with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const category = searchParams.get('category') || undefined;
    const location = searchParams.get('location') || undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const searchTerm = searchParams.get('search') || undefined;

    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }

    let result;
    if (searchTerm) {
      // Perform search if search term is provided
      result = await VendorService.searchVendors(searchTerm, page, limit);
    } else {
      // Get all vendors with filters
      result = await VendorService.getAllVendors(page, limit, category, location, minRating);
    }

    return createApiResponse(result, 'Vendors retrieved successfully');
  } catch (error: any) {
    console.error('Error retrieving vendors:', error);
    return createApiError('Failed to retrieve vendors', 500);
  }
}

// POST /api/vendors - Create a new vendor profile
export async function POST(request: NextRequest) {
  const authResult = await requireAuthApi();
  
  if (!('session' in authResult)) {
    return authResult; // Return error response
  }
  
  const { user } = authResult;
  
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['businessName', 'description', 'category', 'pricing', 'location'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate numeric fields
    if (typeof body.pricing !== 'number' || body.pricing < 0) {
      return createApiError('Pricing must be a positive number', 400);
    }
    
    if (body.portfolio && !Array.isArray(body.portfolio)) {
      return createApiError('Portfolio must be an array of image URLs', 400);
    }
    
    const vendor = await VendorService.createVendor({
      userId: user.id,
      businessName: body.businessName,
      description: body.description,
      category: body.category,
      pricing: body.pricing,
      location: body.location,
      portfolio: body.portfolio,
      availability: body.availability,
    });
    
    return createApiResponse(vendor, 'Vendor profile created successfully', 201);
  } catch (error: any) {
    console.error('Error creating vendor:', error);
    
    if (error.message === 'Vendor profile already exists for this user') {
      return createApiError(error.message, 409);
    }
    
    if (error.message === 'User not found') {
      return createApiError(error.message, 404);
    }
    
    return createApiError('Failed to create vendor profile', 500);
  }
}