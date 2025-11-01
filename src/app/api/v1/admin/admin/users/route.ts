import { NextRequest } from 'next/server';
import { AdminService } from '@/lib/admin-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/admin/users - List all users with filters
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
    const role = searchParams.get('role') || undefined;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || undefined;
    
    const result = await AdminService.getUsers({
      role,
      page,
      limit,
      search
    });
    
    return createApiResponse(result, 'Users retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/admin/users');
  }
}

// PUT /api/admin/users/:userId/status - Activate/deactivate user
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user: adminUser } = authResult;
    
    // Verify user is admin
    const isAdmin = await AdminService.verifyAdmin(adminUser.id);
    if (!isAdmin) {
      return createApiError('Access denied. Admin privileges required.', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'isActive'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    if (typeof body.isActive !== 'boolean') {
      return createApiError('isActive must be a boolean', 400);
    }
    
    // Extract userId from the URL parameter (this would be handled by a dynamic route)
    // For this implementation, we'll use the body
    const updatedUser = await AdminService.updateUserStatus(body.userId, body.isActive);
    
    return createApiResponse(updatedUser, 'User status updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/admin/users/:userId/status');
  }
}