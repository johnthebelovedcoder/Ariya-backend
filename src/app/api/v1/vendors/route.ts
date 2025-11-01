import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, handleApiError } from '@/lib/api-utils';
import { VendorSearchSchema, CreateVendorSchema } from '@/lib/validation-schemas';
import { validateBody, validateQuery } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd } from '@/middleware/request-context';
import { parsePagination, createPaginatedResponse } from '@/lib/pagination-utils';
import { ResponseBuilder } from '@/lib/response-builder';
import Logger from '@/lib/logger-service';

/**
 * GET /api/v1/vendors
 * Get all vendors with optional filtering and search
 */
export async function GET(request: NextRequest) {
  const context = createRequestContext(request);
  
  try {
    await checkRateLimit(request, 'api');
    
    const { searchParams } = new URL(request.url);
    const { page, limit } = parsePagination(searchParams);
    
    // Validate search/filter parameters
    const filters = await validateQuery(request, VendorSearchSchema);
    
    let result;
    if (filters.search) {
      result = await VendorService.searchVendors(filters.search, page, limit);
    } else {
      result = await VendorService.getAllVendors(
        page,
        limit,
        filters.category,
        filters.location,
        filters.minRating
      );
    }

    const response = createPaginatedResponse(
      result.vendors,
      result.total,
      page,
      limit
    );
    
    Logger.debug('Vendors retrieved', {
      requestId: context.requestId,
      count: result.vendors.length,
      filters
    });
    
    logRequestEnd(context, 200);
    return ResponseBuilder.paginated(response, 'Vendors retrieved successfully');
    
  } catch (error: any) {
    Logger.error('Failed to retrieve vendors', {
      requestId: context.requestId,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500);
    return handleApiError(error, 'GET /api/v1/vendors');
  }
}

/**
 * POST /api/v1/vendors
 * Create a new vendor profile
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  const authResult = await requireAuthApi();
  if (!('session' in authResult)) {
    logRequestEnd(context, 401);
    return authResult;
  }
  
  const { user } = authResult;
  
  try {
    await checkRateLimit(request, 'api');
    
    const validated = await validateBody(request, CreateVendorSchema);
    
    const vendor = await VendorService.createVendor({
      userId: user.id,
      ...validated,
    });
    
    Logger.business('Vendor profile created', {
      requestId: context.requestId,
      userId: user.id,
      vendorId: vendor.id,
      businessName: vendor.businessName,
      category: vendor.category
    });
    
    logRequestEnd(context, 201, user.id);
    return ResponseBuilder.created(vendor, 'Vendor profile created successfully');
    
  } catch (error: any) {
    if (error.message === 'Vendor profile already exists for this user') {
      logRequestEnd(context, 409, user.id);
      return handleApiError(error, 'POST /api/v1/vendors');
    }
    
    if (error.message === 'User not found') {
      logRequestEnd(context, 404, user.id);
      return handleApiError(error, 'POST /api/v1/vendors');
    }
    
    Logger.error('Failed to create vendor profile', {
      requestId: context.requestId,
      userId: user.id,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    
    logRequestEnd(context, 500, user.id);
    return handleApiError(error, 'POST /api/v1/vendors');
  }
}