import { NextRequest } from 'next/server';
import { UserService } from '@/lib/user-service';
import { requireAuthApi, requireRoleAuthApi, createApiResponse, createApiError, handleApiError, sanitizeInput } from '@/lib/api-utils';
import { UpdateUserRequest } from '@/types/api';
import { validateUpdateUserRequest } from '@/lib/dto-validation';

// GET /api/users/[id] - Get user by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Validate user ID format (assuming UUID)
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return createApiError('Invalid user ID format', 400);
  }
  
  try {
    const user = await UserService.getUserById(id);
    
    if (!user) {
      return createApiError('User not found', 404);
    }
    
    // Check if the requesting user is the same as the one being requested, or is an admin
    const authResult = await requireAuthApi();
    
    if (!('session' in authResult)) {
      return authResult; // Return error response
    }
    
    const { user: requestingUser } = authResult;
    
    // Allow access if requesting user is the same or is an admin
    if (requestingUser.id !== id) {
      const roleAuthResult = await requireRoleAuthApi(['ADMIN']);
      
      if (!('session' in roleAuthResult)) {
        return roleAuthResult; // Return error response
      }
    }
    
    // Don't return sensitive data like password
    const { password, ...safeUser } = user;
    return createApiResponse(safeUser, 'User retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/users/[id]');
  }
}

// PUT /api/users/[id] - Update user by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Validate user ID format (assuming UUID)
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return createApiError('Invalid user ID format', 400);
  }
  
  try {
    const authResult = await requireAuthApi();
    
    if (!('session' in authResult)) {
      return authResult; // Return error response
    }
    
    const { user: requestingUser } = authResult;
    
    // Only allow user to update their own profile or admin to update any profile
    if (requestingUser.id !== id) {
      const roleAuthResult = await requireRoleAuthApi(['ADMIN']);
      
      if (!('session' in roleAuthResult)) {
        return roleAuthResult; // Return error response
      }
    }
    
    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeInput(body);
    
    // Validate update data using DTO validation
    const validation = validateUpdateUserRequest(sanitizedBody as UpdateUserRequest);
    if (!validation.isValid) {
      return createApiError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
    
    // Don't allow role changes through this endpoint unless admin
    if (sanitizedBody.role && requestingUser.id !== id) {
      // For role changes by admin, we'll have a different endpoint or validate differently
      // For now, we'll only allow admin to change roles
      const adminAuthResult = await requireRoleAuthApi(['ADMIN']);
      
      if (!('session' in adminAuthResult)) {
        // Not an admin, remove role from update
        delete sanitizedBody.role;
      }
    }
    
    const updatedUser = await UserService.updateUser(id, {
      name: sanitizedBody.name,
      email: sanitizedBody.email,
      password: sanitizedBody.password,
      profileImage: sanitizedBody.profileImage,
      phone: sanitizedBody.phone,
    });
    
    // Don't return sensitive data like password
    const { password: _, ...safeUpdatedUser } = updatedUser;
    return createApiResponse(safeUpdatedUser, 'User updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/users/[id]');
  }
}

// DELETE /api/users/[id] - Delete user by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  // Validate user ID format (assuming UUID)
  if (!id || typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    return createApiError('Invalid user ID format', 400);
  }
  
  try {
    const authResult = await requireAuthApi();
    
    if (!('session' in authResult)) {
      return authResult; // Return error response
    }
    
    const { user: requestingUser } = authResult;
    
    // Only allow user to delete their own profile or admin to delete any profile
    if (requestingUser.id !== id) {
      const roleAuthResult = await requireRoleAuthApi(['ADMIN']);
      
      if (!('session' in roleAuthResult)) {
        return roleAuthResult; // Return error response
      }
    }
    
    await UserService.deleteUser(id);
    
    return createApiResponse(null, 'User deleted successfully');
  } catch (error: any) {
    return handleApiError(error, 'DELETE /api/users/[id]');
  }
}