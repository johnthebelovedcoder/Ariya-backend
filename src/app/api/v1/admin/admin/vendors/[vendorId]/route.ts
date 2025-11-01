import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// PUT /api/admin/vendors/[vendorId] - Update vendor status (approve/reject)
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
    
    // Get body data
    const body = await request.json();
    
    let updatedVendor;
    
    if (body.action === 'approve') {
      // Process approval
      updatedVendor = await AdminService.approveVendor(
        vendorId,
        adminUser.id,
        body.notes
      );
    } else if (body.action === 'reject') {
      // Process rejection
      if (!body.reason) {
        return createApiError('reason is required for vendor rejection', 400);
      }
      updatedVendor = await AdminService.rejectVendor(
        vendorId,
        adminUser.id,
        body.reason,
        body.notes
      );
    } else {
      return createApiError('Invalid action. Use "approve" or "reject".', 400);
    }
    
    return createApiResponse(updatedVendor, 'Vendor status updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/admin/vendors/[vendorId]');
  }
}

// GET /api/admin/vendors/[vendorId] - Get vendor details
export async function GET(
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
    
    const vendor = await AdminService.getVendorById(vendorId);
    
    if (!vendor) {
      return createApiError('Vendor not found', 404);
    }
    
    return createApiResponse(vendor, 'Vendor retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/admin/vendors/[vendorId]');
  }
}