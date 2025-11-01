import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/admin/dashboard - Get admin dashboard metrics
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Verify user is admin
    const isAdmin = await AdminService.verifyAdmin(user.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    const metrics = await AdminService.getDashboardMetrics();
    
    return createApiResponse(metrics, 'Admin dashboard metrics retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/admin/dashboard');
  }
}