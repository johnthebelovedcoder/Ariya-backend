import { NextRequest } from 'next/server';
import { UserService } from '@/lib/user-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/users/[id]/avatar - Upload profile picture
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return createApiError('User ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user: requestingUser } = authResult;
    
    // Only allow user to update their own profile
    if (requestingUser.id !== id) {
      return createApiError('You can only update your own profile', 403);
    }
    
    // In a real implementation, we would process the file upload here
    // For now, this is a placeholder that accepts a URL in the request body
    const body = await request.json();
    
    if (!body.avatarUrl || typeof body.avatarUrl !== 'string') {
      return createApiError('avatarUrl is required in request body', 400);
    }
    
    // Validate URL format
    try {
      new URL(body.avatarUrl);
    } catch {
      return createApiError('Invalid avatar URL format', 400);
    }
    
    // Update the user with the new avatar
    const updatedUser = await UserService.updateUser(id, {
      profileImage: body.avatarUrl
    });
    
    return createApiResponse(updatedUser, 'Avatar updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/users/[id]/avatar');
  }
}