import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/admin/vendors/[vendorId]/approve - Approve vendor
export async function PUT(
  request: NextRequest,
  { params }: { params: { vendorId: string } }
) {
  try {
    const { vendorId } = params;
    
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
    
    // Get body data
    const body = await request.json();
    
    // Process approval
    const approvedVendor = await AdminService.approveVendor(
      vendorId,
      adminUser.id,
      body.notes
    );
    
    return createApiResponse(approvedVendor, 'Vendor approved successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/admin/vendors/[vendorId]/approve');
  }
}