import { NextRequest } from 'next/server';
import { UserWarningService } from '@/lib/user-warning-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/user-warnings - Get user warnings
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // For admin to view specific user's warnings
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // If no userId provided, get current user's warnings
    const targetUserId = userId || user.id;
    
    // Check if user is viewing their own warnings or is an admin
    if (targetUserId !== user.id) {
      // Only admins can view other users' warnings
      if (user.role !== 'ADMIN') {
        return createApiError('You do not have permission to view other users\' warnings', 403);
      }
    }
    
    const result = await UserWarningService.getUserWarnings(targetUserId, user.id, page, limit);
    
    return createApiResponse(result, 'User warnings retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/user-warnings');
  }
}

// POST /api/user-warnings - Create a new user warning (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Only admins can create warnings
    if (user.role !== 'ADMIN') {
      return createApiError('Only administrators can create user warnings', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'reason'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    const warning = await UserWarningService.createUserWarning({
      userId: body.userId,
      reason: body.reason,
      isAutomated: body.isAutomated || false,
    }, user.id);
    
    return createApiResponse(warning, 'User warning created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/user-warnings');
  }
}