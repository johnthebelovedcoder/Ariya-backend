import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/vendors/[vendorId]/portfolio - Upload portfolio media
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
    
    // Verify this is the vendor's account
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor || vendor.userId !== user.id) {
      return createApiError('You do not have permission to update this vendor\'s portfolio', 403);
    }
    
    // In a real implementation, this would process file uploads
    // For now, accepting portfolio items as URLs in request body
    const body = await request.json();
    
    if (!body.mediaUrl || typeof body.mediaUrl !== 'string') {
      return createApiError('mediaUrl is required', 400);
    }
    
    // Validate URL format
    try {
      new URL(body.mediaUrl);
    } catch {
      return createApiError('Invalid media URL format', 400);
    }
    
    // Update vendor's portfolio
    const currentPortfolio = vendor.portfolio || [];
    const updatedPortfolio = [...currentPortfolio, body.mediaUrl];
    
    const updatedVendor = await VendorService.updateVendor(vendorId, user.id, {
      portfolio: updatedPortfolio
    });
    
    return createApiResponse({
      vendorId: updatedVendor.id,
      portfolio: updatedVendor.portfolio,
      newItem: body.mediaUrl
    }, 'Portfolio item added successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/vendors/[vendorId]/portfolio');
  }
}