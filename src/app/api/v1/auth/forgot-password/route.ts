import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/auth/forgot-password - Request password reset
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return createApiError('Email is required', 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return createApiError('Invalid email format', 400);
    }
    
    // Attempt to initiate password reset
    await AuthService.requestPasswordReset({
      email: body.email,
      redirectUrl: body.redirectUrl || `${process.env.FRONTEND_URL}/reset-password` // Default redirect URL
    });
    
    // Return success response (even if email doesn't exist to prevent enumeration attacks)
    return createApiResponse(null, 'If an account exists with this email, a password reset link has been sent.');
  } catch (error: any) {
    // Log actual errors for debugging but don't expose to user
    console.error('Password reset request error:', error);
    return handleApiError(error, 'POST /api/auth/forgot-password');
  }
}