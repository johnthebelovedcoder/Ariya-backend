import { NextRequest, NextResponse } from 'next/server';
import { validateInput, sanitizeInput } from './validation';
import { withRateLimit } from './rate-limit';

// Middleware for input validation and sanitization
export const validateAndSanitize = (req: NextRequest, rules: { [key: string]: any }) => {
  const body = req.body || {};
  const query = Object.fromEntries(req.nextUrl.searchParams);
  
  // Combine body and query parameters for validation
  const allInput = { ...body, ...query };
  
  // Validate input
  const { isValid, errors } = validateInput(allInput, rules);
  
  if (!isValid) {
    return NextResponse.json(
      {
        success: false,
        message: 'Validation failed',
        errors
      },
      { status: 400 }
    );
  }
  
  // Sanitize input
  const sanitizedBody = sanitizeInput(body);
  const sanitizedQuery = sanitizeInput(query);
  
  // Return sanitized inputs
  return {
    isValid: true,
    sanitizedBody,
    sanitizedQuery
  };
};

// Middleware for role-based access control
export const requireRoles = (allowedRoles: string[]) => {
  return async (req: NextRequest) => {
    // This assumes there's an auth session available
    // In a real implementation, you'd get the session from your auth system
    // For now, we'll return a function that can be called by the route
    
    // This is a stub - the actual implementation would depend on your auth system
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        {
          success: false,
          message: 'Authentication required'
        },
        { status: 401 }
      );
    }
    
    // Here you would decode and validate the JWT
    // const token = authHeader.substring(7);
    // const decoded = validateAndDecodeToken(token);
    // if (!decoded || !allowedRoles.includes(decoded.role)) {
    //   return NextResponse.json(
    //     {
    //       success: false,
    //       message: 'Insufficient permissions'
    //     },
    //     { status: 403 }
    //   );
    // }
    
    // Return a placeholder response
    return null; // Continue with the request
  };
};

// Middleware for rate limiting
export const applyRateLimit = async (req: NextRequest, limitType: 'auth' | 'api' | 'upload' = 'api') => {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             req.headers.get('x-real-ip') || 
             req.ip || 
             'unknown';
  
  const limitResult = await withRateLimit(
    (id) => {
      // This would call the appropriate rate limit function
      // For now, returning a mock function
      return { allowed: true };
    },
    `${limitType}:${ip}`,
    100, // Default max requests
    3600000 // 1 hour default window
  );
  
  if (!limitResult.allowed) {
    const resetTime = limitResult.resetTime ? new Date(limitResult.resetTime).toISOString() : 'unknown';
    return NextResponse.json(
      {
        success: false,
        message: 'Rate limit exceeded',
        retryAfter: resetTime
      },
      { 
        status: 429,
        headers: {
          'Retry-After': Math.floor((limitResult.resetTime! - Date.now()) / 1000).toString()
        }
      }
    );
  }
  
  return null; // Continue with the request
};

// Middleware for CSRF protection
export const csrfProtection = (req: NextRequest) => {
  // Check for CSRF token in headers
  const csrfToken = req.headers.get('x-csrf-token');
  const expectedToken = req.headers.get('origin') || req.headers.get('referer');
  
  // This is a simplified check - in a real app you'd have a proper CSRF token system
  if (!csrfToken) {
    // For API endpoints, we might just check for a proper content-type header
    const contentType = req.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      // This is likely an API request, so we'll allow it
      return null;
    }
    
    // For non-API requests, we might require a CSRF token
    return NextResponse.json(
      {
        success: false,
        message: 'CSRF token required'
      },
      { status: 403 }
    );
  }
  
  // Validate the CSRF token
  // In a real implementation, you'd compare the token to one stored in the session
  return null; // Continue with the request
};

// Middleware for common security headers
export const securityHeaders = (res: NextResponse) => {
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return res;
};

// Comprehensive security middleware that combines all security measures
export const withSecurity = (handler: Function, options?: {
  validationRules?: { [key: string]: any };
  allowedRoles?: string[];
  rateLimit?: 'auth' | 'api' | 'upload';
  requireAuth?: boolean;
}) => {
  return async (req: NextRequest, ...args: any[]) => {
    // Apply rate limiting
    if (options?.rateLimit) {
      const rateLimitResult = await applyRateLimit(req, options.rateLimit);
      if (rateLimitResult) {
        return rateLimitResult;
      }
    }
    
    // Apply input validation and sanitization
    if (options?.validationRules) {
      const validationResult = validateAndSanitize(req, options.validationRules);
      if (!validationResult.isValid) {
        return validationResult; // Return validation error
      }
      
      // Replace the request body with sanitized data
      // Note: In Next.js middleware, you can't directly modify the request body
      // This would be handled differently in the actual route
    }
    
    // Apply role-based access control
    if (options?.allowedRoles) {
      const roleCheckResult = await requireRoles(options.allowedRoles)(req);
      if (roleCheckResult) {
        return roleCheckResult;
      }
    }
    
    // Apply CSRF protection
    const csrfResult = csrfProtection(req);
    if (csrfResult) {
      return csrfResult;
    }
    
    // Call the original handler
    return handler(req, ...args);
  };
};