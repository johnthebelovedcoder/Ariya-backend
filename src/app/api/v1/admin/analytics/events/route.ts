import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/admin/analytics/events - Get event creation metrics
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
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const eventType = searchParams.get('eventType');
    
    const metrics = await AdminService.getEventCreationMetrics({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      eventType
    });
    
    return createApiResponse(metrics, 'Event creation metrics retrieved successfully');
  } catch (error: unknown) {
    return handleApiError(error, 'GET /api/admin/analytics/events');
  }
}