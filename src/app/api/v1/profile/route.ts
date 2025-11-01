import { NextRequest } from 'next/server';
import { UserService } from '@/lib/user-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError, sanitizeInput } from '@/lib/api-utils';
import { validateInput } from '@/lib/validation';

// GET /api/profile - Get current user's profile
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const userProfile = await UserService.getUserById(user.id);
    
    if (!userProfile) {
      return createApiError('User not found', 404);
    }
    
    // Extract first name and last name from full name
    const nameParts = userProfile.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return createApiResponse({
      id: userProfile.id,
      firstName,
      lastName,
      name: userProfile.name,
      email: userProfile.email,
      role: userProfile.role,
      profileImage: userProfile.profileImage,
      phone: userProfile.phone,
      country: userProfile.country,
      currency: userProfile.currency,
      createdAt: userProfile.createdAt,
      updatedAt: userProfile.updatedAt
    }, 'User profile retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/profile');
  }
}

// PUT /api/profile - Update current user's profile
export async function PUT(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeInput(body);
    
    // Validate input
    const validationRules = {
      firstName: { required: true, minLength: 2, maxLength: 50, type: 'string' },
      lastName: { required: true, minLength: 2, maxLength: 50, type: 'string' },
      email: { type: 'email', maxLength: 255 },
      phone: { maxLength: 20, type: 'string' },
      profileImage: { type: 'string', maxLength: 500 }
    };
    
    const validation = validateInput(sanitizedBody, validationRules);
    if (!validation.isValid) {
      return createApiError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
    
    // Combine first and last name into a single name field
    const fullName = `${sanitizedBody.firstName.trim()} ${sanitizedBody.lastName.trim()}`;
    
    // Update user profile
    const updatedUser = await UserService.updateUser(user.id, {
      name: fullName,
      email: sanitizedBody.email?.toLowerCase(),
      phone: sanitizedBody.phone?.trim(),
      profileImage: sanitizedBody.profileImage
    });
    
    // Extract first name and last name from full name
    const nameParts = updatedUser.name.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';
    
    return createApiResponse({
      id: updatedUser.id,
      firstName,
      lastName,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      profileImage: updatedUser.profileImage,
      phone: updatedUser.phone,
      updatedAt: updatedUser.updatedAt
    }, 'User profile updated successfully');
  } catch (error: any) {
    return handleApiError(error, 'PUT /api/profile');
  }
}