import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/auth/verify-email - Verify email with token
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.token) {
      return createApiError('Verification token is required', 400);
    }
    
    // Validate token format
    if (typeof body.token !== 'string' || body.token.trim().length === 0) {
      return createApiError('Invalid token format', 400);
    }
    
    // Attempt to verify email
    const result = await AuthService.verifyEmail({
      token: body.token
    });
    
    // Return success response
    return createApiResponse({
      userId: result.userId,
      email: result.email,
      verifiedAt: result.verifiedAt
    }, 'Email verified successfully');
  } catch (error: any) {
    // Handle specific email verification errors
    if (error.message === 'Invalid or expired verification token') {
      return createApiError('Invalid or expired email verification token', 400);
    }
    
    if (error.message === 'Email already verified') {
      return createApiError('Email is already verified', 400);
    }
    
    return handleApiError(error, 'POST /api/auth/verify-email');
  }
}

// GET /api/auth/verify-email - Resend verification email
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    // Validate email parameter
    if (!email) {
      return createApiError('Email parameter is required', 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return createApiError('Invalid email format', 400);
    }
    
    // Attempt to resend verification email
    await AuthService.resendVerificationEmail({
      email: email,
      redirectUrl: searchParams.get('redirectUrl') || `${process.env.FRONTEND_URL}/verify-email`
    });
    
    // Return success response
    return createApiResponse(null, 'Verification email resent successfully');
  } catch (error: any) {
    // Handle specific resend errors
    if (error.message === 'User not found') {
      return createApiError('No account found with this email address', 404);
    }
    
    if (error.message === 'Email already verified') {
      return createApiError('Email is already verified', 400);
    }
    
    return handleApiError(error, 'GET /api/auth/verify-email');
  }
}