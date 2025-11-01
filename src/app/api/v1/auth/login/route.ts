import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { LoginSchema } from '@/lib/validation-schemas';
import { validateBody } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd, logRequestError } from '@/middleware/request-context';
import Logger from '@/lib/logger-service';

/**
 * POST /api/v1/auth/login
 * Authenticate user and return access tokens
 * 
 * @param request - NextRequest object
 * @returns User data with access and refresh tokens
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  try {
    // Rate limiting for authentication endpoints
    await checkRateLimit(request, 'auth');
    
    // Validate request body with Zod schema
    const validated = await validateBody(request, LoginSchema);
    
    Logger.info('Login attempt', {
      requestId: context.requestId,
      email: validated.email,
      ip: context.ip
    });
    
    // Attempt to login user
    const result = await AuthService.login({
      email: validated.email,
      password: validated.password,
      rememberMe: validated.rememberMe,
    });
    
    Logger.auth('Login successful', result.user.id, {
      requestId: context.requestId,
      email: validated.email,
      role: result.user.role
    });
    
    logRequestEnd(context, 200, result.user.id);
    
    // Return success response with user data and tokens
    return createApiResponse({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        isVerified: result.user.isVerified,
        createdAt: result.user.createdAt,
        updatedAt: result.user.updatedAt
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Login successful');
    
  } catch (error: any) {
    // Handle specific authentication errors
    if (error.message === 'Invalid credentials') {
      Logger.warn('Login failed - invalid credentials', {
        requestId: context.requestId,
        ip: context.ip
      });
      logRequestEnd(context, 401);
      return createApiError('Invalid email or password', 401);
    }
    
    if (error.message === 'Account not verified') {
      logRequestEnd(context, 403);
      return createApiError('Please verify your email before logging in', 403);
    }
    
    if (error.message === 'Account suspended') {
      Logger.security('Login attempt on suspended account', {
        requestId: context.requestId,
        ip: context.ip
      });
      logRequestEnd(context, 403);
      return createApiError('Your account has been suspended. Please contact support.', 403);
    }
    
    if (error.message === 'Account temporarily locked due to multiple failed login attempts') {
      Logger.security('Login attempt on locked account', {
        requestId: context.requestId,
        ip: context.ip
      });
      logRequestEnd(context, 403);
      return createApiError('Account temporarily locked. Please try again later.', 403);
    }
    
    logRequestError(context, error);
    logRequestEnd(context, 500);
    return handleApiError(error, 'POST /api/v1/auth/login');
  }
}