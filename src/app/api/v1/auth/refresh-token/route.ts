import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/auth/refresh-token - Refresh JWT token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate refresh token
    if (!body.refreshToken) {
      return createApiError('Refresh token is required', 400);
    }
    
    if (typeof body.refreshToken !== 'string' || body.refreshToken.trim().length === 0) {
      return createApiError('Invalid refresh token format', 400);
    }
    
    // Attempt to refresh tokens
    const result = await AuthService.refreshTokens({
      refreshToken: body.refreshToken
    });
    
    // Return new tokens
    return createApiResponse({
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn
    }, 'Tokens refreshed successfully');
  } catch (error: any) {
    // Handle specific token refresh errors
    if (error.message === 'Invalid refresh token') {
      return createApiError('Invalid refresh token', 401);
    }
    
    if (error.message === 'Refresh token expired') {
      return createApiError('Refresh token has expired. Please log in again.', 401);
    }
    
    if (error.message === 'Refresh token revoked') {
      return createApiError('Refresh token has been revoked. Please log in again.', 401);
    }
    
    return handleApiError(error, 'POST /api/auth/refresh-token');
  }
}