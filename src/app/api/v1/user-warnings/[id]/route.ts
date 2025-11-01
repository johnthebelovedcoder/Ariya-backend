import { NextRequest } from 'next/server';
import { UserWarningService } from '@/lib/user-warning-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// Helper to extract ID from URL  
function getWarningIdFromUrl(url: string): string | null {
  // Extract ID from URL - expecting format like /api/user-warnings/[id]
  const match = url.match(/\/api\/user-warnings\/([^\/\?]+)/);
  return match ? match[1] : null;
}

// GET /api/user-warnings/[id] - Get a specific warning by ID
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const warningId = getWarningIdFromUrl(request.url);
    
    if (!warningId) {
      return createApiError('Warning ID is required', 400);
    }
    
    const warning = await UserWarningService.getWarningById(warningId, user.id);
    
    if (!warning) {
      return createApiError('Warning not found or you do not have permission', 404);
    }
    
    return createApiResponse(warning, 'User warning retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/user-warnings/[id]');
  }
}