import { NextRequest } from 'next/server';
import { UserService } from '@/lib/user-service';
import { requireRoleAuthApi, createApiResponse, createApiError, handleApiError, sanitizeInput } from '@/lib/api-utils';
import { UserRole } from '@prisma/client';
import { CreateUserRequest, UpdateUserRequest } from '@/types/api';
import { validateCreateUserRequest } from '@/lib/dto-validation';
import { ConfigService } from '@/lib/config-service';

// GET /api/users - Get all users (Admin only)
export async function GET(request: NextRequest) {
  try {
    // Check for admin authentication
    await requireRoleAuthApi(['ADMIN']);
    
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role') as UserRole | null;
    const region = searchParams.get('region') || null; // New regional filtering parameter
    const country = searchParams.get('country') || 'NG'; // Country for database routing
    const currency = searchParams.get('currency') || null; // Currency preference
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    // Use the country for database routing in the service layer
    const result = await UserService.getAllUsers(page, limit, role, country);
    
    // If region parameter is provided, filter users by country
    if (region && result.users) {
      // Map region to countries
      const regionCountries: Record<string, string[]> = {
        'US': ['US', 'CA', 'MX'],
        'EU': ['GB', 'DE', 'FR', 'IT', 'ES'],
        'APAC': ['JP', 'CN', 'IN', 'AU', 'SG'],
        'AFRICA': ['NG', 'GH', 'KE', 'ZA'],
      };
      
      const countries = regionCountries[region.toUpperCase()] || [];
      result.users = result.users.filter(user => countries.includes(user.country || ''));
      
      // Update total count after filtering
      result.pagination.total = result.users.length;
      result.pagination.pages = Math.ceil(result.pagination.total / limit);
    }
    
    return createApiResponse({
      ...result,
      region: country, // Include regional information in response
      currency: currency, // Include currency preference
      timestamp: new Date().toISOString()
    }, 'Users retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/users');
  }
}

// POST /api/users - Create a new user (Public endpoint)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Sanitize input
    const sanitizedBody = sanitizeInput(body);
    
    // Validate request body using DTO validation
    const validation = validateCreateUserRequest(sanitizedBody as CreateUserRequest);
    if (!validation.isValid) {
      return createApiError(`Validation failed: ${validation.errors.join(', ')}`, 400);
    }
    
    const user = await UserService.createUser({
      name: sanitizedBody.name,
      email: sanitizedBody.email,
      password: sanitizedBody.password,
      role: sanitizedBody.role || 'PLANNER',
      profileImage: sanitizedBody.profileImage,
      phone: sanitizedBody.phone,
    });
    
    return createApiResponse(user, 'User created successfully', 201);
  } catch (error: unknown) {
    return handleApiError(error, 'POST /api/users');
  }
}