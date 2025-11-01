import { NextRequest } from 'next/server';
import { VendorService } from '@/lib/vendor-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract media ID from URL
function getMediaIdFromUrl(url: string): string | null {
  // Extract mediaId from URL - pattern: /api/vendors/[vendorId]/portfolio/[mediaId]
  const match = url.match(/\/api\/vendors\/[^\/]+\/portfolio\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// DELETE /api/vendors/[vendorId]/portfolio/[mediaId] - Delete portfolio item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: vendorId } = params;
    const mediaId = getMediaIdFromUrl(request.url);
    
    if (!vendorId || !mediaId) {
      return createApiError('Vendor ID and Media ID are required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify this is the vendor's account
    const vendor = await VendorService.getVendorById(vendorId);
    if (!vendor || vendor.userId !== user.id) {
      return createApiError('You do not have permission to update this vendor\'s portfolio', 403);
    }
    
    // In a real implementation, this would delete the media file from storage
    // For now, we'll remove the URL from the vendor's portfolio array
    
    const currentPortfolio = vendor.portfolio || [];
    const updatedPortfolio = currentPortfolio.filter(item => item !== mediaId);
    
    // Only update if the item was actually in the portfolio
    if (currentPortfolio.length === updatedPortfolio.length) {
      return createApiError('Portfolio item not found', 404);
    }
    
    const updatedVendor = await VendorService.updateVendor(vendorId, user.id, {
      portfolio: updatedPortfolio
    });
    
    return createApiResponse(null, 'Portfolio item deleted successfully', 204);
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/vendors/[vendorId]/portfolio/[mediaId]');
  }
}