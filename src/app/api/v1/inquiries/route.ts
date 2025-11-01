import { NextRequest } from 'next/server';
import { InquiryService } from '@/lib/inquiry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/inquiries - List inquiries (for either user or vendor)
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const vendorId = searchParams.get('vendorId'); // If getting vendor inquiries
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (vendorId) {
      // Get inquiries for a specific vendor (user must be vendor owner)
      const result = await InquiryService.getVendorInquiries(vendorId, user.id, page, limit);
      return createApiResponse(result, 'Vendor inquiries retrieved successfully');
    } else {
      // Get inquiries sent by user (for their events)
      const result = await InquiryService.getUserInquiries(user.id, page, limit);
      return createApiResponse(result, 'User inquiries retrieved successfully');
    }
  } catch (error: any) {
    return handleApiError(error, 'GET /api/inquiries');
  }
}

// POST /api/inquiries - Send inquiry/quote request to vendor
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['vendorId', 'message'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate vendorId is a string
    if (typeof body.vendorId !== 'string') {
      return createApiError('vendorId must be a string', 400);
    }
    
    // Validate message is not empty
    if (typeof body.message !== 'string' || body.message.trim().length === 0) {
      return createApiError('message is required and cannot be empty', 400);
    }
    
    const inquiry = await InquiryService.createInquiry({
      vendorId: body.vendorId,
      message: body.message,
      eventDetails: body.eventDetails,
      budgetRange: body.budgetRange,
      eventDate: body.eventDate ? new Date(body.eventDate) : undefined,
      requiredServices: body.requiredServices,
    }, user.id);
    
    return createApiResponse(inquiry, 'Inquiry sent successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/inquiries');
  }
}