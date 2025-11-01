import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/admin/vendors/[vendorId]/reject - Reject vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ vendorId: string }> }
) {
  try {
    const { vendorId } = await params;
    
    if (!vendorId) {
      return createApiError('Vendor ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user: adminUser } = authResult;
    
    // Verify user is admin
    const isAdmin = await AdminService.verifyAdmin(adminUser.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields for rejection
    if (!body.reason) {
      return createApiError('reason is required for vendor rejection', 400);
    }
    
    // Process rejection
    const rejectedVendor = await AdminService.rejectVendor(
      vendorId,
      adminUser.id,
      body.reason,
      body.notes
    );
    
    return createApiResponse(rejectedVendor, 'Vendor rejected successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/admin/vendors/[vendorId]/reject');
  }
}