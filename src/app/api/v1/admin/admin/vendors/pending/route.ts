import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/admin/vendors/pending - Get pending vendor approvals
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user is admin
    const isAdmin = await AdminService.verifyAdmin(user.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    
    const result = await AdminService.getPendingVendors({
      category,
      page,
      limit,
      search
    });
    
    return createApiResponse(result, 'Pending vendors retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/admin/vendors/pending');
  }
}