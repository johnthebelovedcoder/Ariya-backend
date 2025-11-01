import { NextRequest } from 'next/server';
import { UserRestrictionService } from '@/lib/user-restriction-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/user-restrictions - Get user restrictions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId'); // For admin to view specific user's restrictions
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // If no userId provided, get current user's restrictions
    const targetUserId = userId || user.id;
    
    // Check if user is viewing their own restrictions or is an admin
    if (targetUserId !== user.id) {
      // Only admins can view other users' restrictions
      if (user.role !== 'ADMIN') {
        return createApiError('You do not have permission to view other users\' restrictions', 403);
      }
    }
    
    const result = await UserRestrictionService.getUserRestrictions(targetUserId, user.id, page, limit);
    
    return createApiResponse(result, 'User restrictions retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/user-restrictions');
  }
}

// POST /api/user-restrictions - Create a new user restriction (admin only)
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Only admins can create restrictions
    if (user.role !== 'ADMIN') {
      return createApiError('Only administrators can create user restrictions', 403);
    }
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['userId', 'type', 'reason'];
    for (const field of requiredFields) {
      if (body[field] === undefined) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    if (typeof body.type !== 'string' || !['MESSAGING_RESTRICTION', 'ACCOUNT_SUSPENSION', 'FEATURE_LOCK'].includes(body.type)) {
      return createApiError('Invalid restriction type', 400);
    }
    
    const restriction = await UserRestrictionService.createUserRestriction({
      userId: body.userId,
      type: body.type,
      reason: body.reason,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    }, user.id);
    
    return createApiResponse(restriction, 'User restriction created successfully', 201);
  } catch (error: any) {
    return handleApiError(error, 'POST /api/user-restrictions');
  }
}