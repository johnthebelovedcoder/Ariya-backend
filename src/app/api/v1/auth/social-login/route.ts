import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/auth/social-login - Social login (Google/Facebook)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['provider', 'accessToken'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate provider
    const validProviders = ['google', 'facebook'];
    if (!validProviders.includes(body.provider.toLowerCase())) {
      return createApiError(`Provider must be one of: ${validProviders.join(', ')}`, 400);
    }
    
    // Validate access token
    if (typeof body.accessToken !== 'string' || body.accessToken.trim().length === 0) {
      return createApiError('Invalid access token format', 400);
    }
    
    // Validate role if provided
    if (body.role !== undefined) {
      const validRoles = ['PLANNER', 'VENDOR'];
      if (!validRoles.includes(body.role)) {
        return createApiError(`Role must be one of: ${validRoles.join(', ')}`, 400);
      }
    }
    
    // Attempt social login
    const result = await AuthService.socialLogin({
      provider: body.provider.toLowerCase(),
      accessToken: body.accessToken,
      role: body.role || 'PLANNER', // Default to planner if not specified
      redirectUrl: body.redirectUrl || `${process.env.FRONTEND_URL}/dashboard`
    });
    
    // Return success response with user data and tokens
    return createApiResponse({
      user: result.user,
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      isNewUser: result.isNewUser
    }, 'Social login successful');
  } catch (error: any) {
    // Handle specific social login errors
    if (error.message === 'Invalid access token') {
      return createApiError('Invalid social login access token', 400);
    }
    
    if (error.message === 'Social account not verified') {
      return createApiError('Please verify your social account before logging in', 400);
    }
    
    if (error.message === 'Email already registered') {
      return createApiError('An account with this email already exists. Please log in with your existing credentials.', 409);
    }
    
    return handleApiError(error, 'POST /api/auth/social-login');
  }
}