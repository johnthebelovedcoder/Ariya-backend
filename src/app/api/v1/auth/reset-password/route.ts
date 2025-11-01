import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/auth/reset-password - Reset password with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['token', 'newPassword'];
    for (const field of requiredFields) {
      if (!body[field]) {
        return createApiError(`${field} is required`, 400);
      }
    }
    
    // Validate password strength
    if (typeof body.newPassword !== 'string' || body.newPassword.length < 8) {
      return createApiError('Password must be at least 8 characters long', 400);
    }
    
    // Validate token format
    if (typeof body.token !== 'string' || body.token.trim().length === 0) {
      return createApiError('Invalid token format', 400);
    }
    
    // Attempt to reset password
    const result = await AuthService.resetPassword({
      token: body.token,
      newPassword: body.newPassword,
      confirmPassword: body.confirmPassword || body.newPassword
    });
    
    // Return success response
    return createApiResponse({
      userId: result.userId,
      email: result.email
    }, 'Password reset successfully');
  } catch (error: any) {
    // Handle specific password reset errors
    if (error.message === 'Invalid or expired token') {
      return createApiError('Invalid or expired password reset token', 400);
    }
    
    if (error.message === 'Passwords do not match') {
      return createApiError('Passwords do not match', 400);
    }
    
    if (error.message === 'Password cannot be the same as previous password') {
      return createApiError('New password must be different from current password', 400);
    }
    
    return handleApiError(error, 'POST /api/auth/reset-password');
  }
}