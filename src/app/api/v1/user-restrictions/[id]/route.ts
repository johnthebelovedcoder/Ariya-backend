import { NextRequest } from 'next/server';
import { UserRestrictionService } from '@/lib/user-restriction-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract ID from URL
function getRestrictionIdFromUrl(url: string): string | null {
  // Extract ID from URL - expecting format like /api/user-restrictions/[id]
  const match = url.match(/\/api\/user-restrictions\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/user-restrictions/[id] - Get a specific restriction by ID
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const restrictionId = getRestrictionIdFromUrl(request.url);
    
    if (!restrictionId) {
      return createApiError('Restriction ID is required', 400);
    }
    
    const restriction = await UserRestrictionService.getRestrictionById(restrictionId, user.id);
    
    if (!restriction) {
      return createApiError('Restriction not found or you do not have permission', 404);
    }
    
    return createApiResponse(restriction, 'User restriction retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/user-restrictions/[id]');
  }
}

// PUT /api/user-restrictions/[id] - Update a restriction
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Only admins can update restrictions
    if (user.role !== 'ADMIN') {
      return createApiError('Only administrators can update user restrictions', 403);
    }
    
    const restrictionId = getRestrictionIdFromUrl(request.url);
    
    if (!restrictionId) {
      return createApiError('Restriction ID is required', 400);
    }
    
    const body = await request.json();
    
    const restriction = await UserRestrictionService.updateUserRestriction(restrictionId, user.id, {
      reason: body.reason,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });
    
    return createApiResponse(restriction, 'User restriction updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/user-restrictions/[id]');
  }
}

// DELETE /api/user-restrictions/[id] - Remove (deactivate) a restriction
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Only admins can remove restrictions
    if (user.role !== 'ADMIN') {
      return createApiError('Only administrators can remove user restrictions', 403);
    }
    
    const restrictionId = getRestrictionIdFromUrl(request.url);
    
    if (!restrictionId) {
      return createApiError('Restriction ID is required', 400);
    }
    
    const body = await request.json().catch(() => ({})); // In case of DELETE with no body
    
    if (!body.removalReason) {
      return createApiError('removalReason is required', 400);
    }
    
    const restriction = await UserRestrictionService.removeUserRestriction(restrictionId, user.id, body.removalReason);
    
    return createApiResponse(restriction, 'User restriction removed successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/user-restrictions/[id]');
  }
}