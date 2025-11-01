import { NextRequest } from 'next/server';
import { AuthService } from '@/lib/auth-service';
import { createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';
import { RegisterSchema } from '@/lib/validation-schemas';
import { validateBody } from '@/middleware/validate-request';
import { checkRateLimit } from '@/middleware/rate-limit-check';
import { createRequestContext, logRequestEnd, logRequestError } from '@/middleware/request-context';
import { withTransaction } from '@/lib/transaction';
import Logger from '@/lib/logger-service';
import prisma from '@/lib/prisma';

/**
 * POST /api/v1/auth/register
 * Register a new user account (planner or vendor)
 * 
 * @param request - NextRequest object
 * @returns User data with access and refresh tokens
 */
export async function POST(request: NextRequest) {
  const context = createRequestContext(request);
  
  try {
    // Rate limiting for registration endpoints
    await checkRateLimit(request, 'auth');
    
    // Validate request body with Zod schema
    const validated = await validateBody(request, RegisterSchema);
    
    Logger.info('Registration attempt', {
      requestId: context.requestId,
      email: validated.email,
      role: validated.role,
      ip: context.ip
    });
    
    // Register user with transaction for atomicity
    const result = await withTransaction(async (tx) => {
      // Create user account
      const user = await AuthService.register({
        firstName: validated.firstName,
        lastName: validated.lastName,
        email: validated.email,
        password: validated.password,
        role: validated.role,
      });
      
      // Create vendor profile if role is VENDOR
      if (validated.role === 'VENDOR' && validated.businessName) {
        await tx.vendor.create({
          data: {
            userId: user.user.id,
            businessName: validated.businessName,
            category: validated.category || '',
            description: validated.description || '',
            pricing: validated.pricing || 0,
            location: validated.location || '',
          }
        });
      }
      
      // Update user with additional fields if provided
      if (validated.phone || validated.country || validated.currency) {
        await tx.user.update({
          where: { id: user.user.id },
          data: {
            phone: validated.phone,
            country: validated.country,
            currency: validated.currency,
          }
        });
      }
      
      return user;
    });
    
    Logger.business('User registered', {
      requestId: context.requestId,
      userId: result.user.id,
      email: validated.email,
      role: validated.role
    });
    
    logRequestEnd(context, 201, result.user.id);
    
    // Return success response
    return createApiResponse({
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
        isVerified: result.user.isVerified,
        createdAt: result.user.createdAt
      },
      accessToken: result.accessToken,
      refreshToken: result.refreshToken
    }, 'Registration successful. Please check your email to verify your account.', 201);
  } catch (error: any) {
    // Handle specific registration errors
    if (error.message === 'User with this email already exists') {
      logRequestEnd(context, 409);
      return createApiError('A user with this email already exists', 409);
    }
    
    if (error.message.includes('Password does not meet security requirements')) {
      logRequestEnd(context, 400);
      return createApiError(error.message, 400);
    }
    
    logRequestError(context, error);
    logRequestEnd(context, 500);
    return handleApiError(error, 'POST /api/v1/auth/register');
  }
}