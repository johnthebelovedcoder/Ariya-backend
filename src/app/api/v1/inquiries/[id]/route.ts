import { NextRequest } from 'next/server';
import { InquiryService } from '@/lib/inquiry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract inquiry ID from URL
function getInquiryIdFromUrl(url: string): string | null {
  // Extract ID from URL - expecting format like /api/inquiries/[id]
  const match = url.match(/\/api\/inquiries\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/inquiries/[id] - Get inquiry details
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const inquiryId = getInquiryIdFromUrl(request.url);
    
    if (!inquiryId) {
      return createApiError('Inquiry ID is required', 400);
    }
    
    const inquiry = await InquiryService.getInquiryById(inquiryId, user.id);
    
    if (!inquiry) {
      return createApiError('Inquiry not found or you do not have permission', 404);
    }
    
    return createApiResponse(inquiry, 'Inquiry retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/inquiries/[id]');
  }
}

// PUT /api/inquiries/[id]/respond - Vendor responds with quote
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Extract inquiry ID from URL path
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const inquiryId = pathParts[pathParts.length - 2]; // Get the ID before 'respond'
    
    if (!inquiryId) {
      return createApiError('Inquiry ID is required', 400);
    }
    
    const body = await request.json();
    
    // Check if this is a respond operation
    if (url.pathname.includes('/respond')) {
      // Validate required fields for quote response
      const requiredFields = ['quoteAmount', 'quoteDetails'];
      for (const field of requiredFields) {
        if (body[field] === undefined) {
          return createApiError(`${field} is required for quote response`, 400);
        }
      }
      
      if (typeof body.quoteAmount !== 'number' || body.quoteAmount < 0) {
        return createApiError('quoteAmount must be a non-negative number', 400);
      }
      
      if (typeof body.quoteDetails !== 'string' || body.quoteDetails.trim().length === 0) {
        return createApiError('quoteDetails is required and cannot be empty', 400);
      }
      
      const inquiry = await InquiryService.respondToInquiry(
        inquiryId, 
        user.id, 
        body.quoteAmount, 
        body.quoteDetails
      );
      
      return createApiResponse(inquiry, 'Quote response sent successfully');
    } 
    // Check if this is a status update operation
    else if (url.pathname.includes('/status')) {
      if (typeof body.status !== 'string' || body.status.trim().length === 0) {
        return createApiError('status is required for status update', 400);
      }
      
      const inquiry = await InquiryService.updateInquiryStatus(
        inquiryId, 
        user.id, 
        body.status
      );
      
      return createApiResponse(inquiry, 'Inquiry status updated successfully');
    }
    // Default PUT - update inquiry details
    else {
      return createApiError('Invalid endpoint. Use /respond or /status for specific operations', 400);
    }
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/inquiries/[id]');
  }
}