import { NextRequest } from 'next/server';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/auth/logout - User logout
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user, session } = authResult;
    
    // Extract refresh token from request (could be in body or header)
    let refreshToken = null;
    
    try {
      const body = await request.json();
      refreshToken = body.refreshToken;
    } catch {
      // If body parsing fails, try to get from headers
      refreshToken = request.headers.get('x-refresh-token');
    }
    
    // If no refresh token provided, invalidate current session
    if (!refreshToken) {
      refreshToken = session?.refreshToken;
    }
    
    // Attempt to logout user
    await AuthService.logout({
      userId: user.id,
      refreshToken: refreshToken,
      invalidateAllSessions: false
    });
    
    // Return success response
    return createApiResponse(null, 'Logout successful');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/auth/logout');
  }
}