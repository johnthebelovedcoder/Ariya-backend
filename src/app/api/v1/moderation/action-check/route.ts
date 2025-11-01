import { NextRequest } from 'next/server';
import { ModerationService } from '@/lib/moderation-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// POST /api/moderation/action-check - Check if user can perform a specific action
export async function POST(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const body = await request.json();
    
    // Validate required fields
    if (!body.action) {
      return createApiError('action is required', 400);
    }
    
    const validActions = ['MESSAGE', 'BOOK', 'CREATE_EVENT', 'CREATE_VENDOR_PROFILE'];
    if (!validActions.includes(body.action)) {
      return createApiError('Invalid action', 400);
    }
    
    const result = await ModerationService.canUserPerformAction(user.id, body.action as any);
    
    if (!result.canPerform) {
      return createApiError(`Cannot perform action: ${result.reason}`, 403);
    }
    
    return createApiResponse({ canPerform: true, action: body.action }, 'Action is permitted');
  } catch (error: any) {
    return handleApiError(error, 'POST /api/moderation/action-check');
  }
}