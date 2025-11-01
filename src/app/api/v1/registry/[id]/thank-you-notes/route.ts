import { NextRequest } from 'next/server';
import { RegistryService } from '@/lib/registry-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/registry/[id]/thank-you-notes - Get thank-you note tracker
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id: eventId } = params;
    
    if (!eventId) {
      return createApiError('Event ID is required', 400);
    }
    
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    // Get query parameters for filtering
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // 'sent', 'pending', 'all'
    const contributorId = searchParams.get('contributorId');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Validate pagination parameters
    if (page < 1 || limit < 1 || limit > 100) {
      return createApiError('Invalid pagination parameters', 400);
    }
    
    const thankYouNotes = await RegistryService.getThankYouNotes(
      eventId,
      user.id,
      {
        status: status as 'sent' | 'pending' | 'all',
        contributorId,
        page,
        limit
      }
    );
    
    return createApiResponse(thankYouNotes, 'Thank-you notes retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/registry/[id]/thank-you-notes');
  }
}