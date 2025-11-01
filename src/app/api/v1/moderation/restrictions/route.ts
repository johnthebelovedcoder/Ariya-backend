import { NextRequest } from 'next/server';
import { ModerationService } from '@/lib/moderation-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/moderation/restrictions - Get current user's restrictions
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const restrictions = await ModerationService.getUserRestrictions(user.id);
    
    return createApiResponse({
      user: {
        id: user.id,
        email: user.email,
        name: user.name
      },
      restrictions,
      canMessage: (await ModerationService.canUserPerformAction(user.id, 'MESSAGE')).canPerform,
      canBook: (await ModerationService.canUserPerformAction(user.id, 'BOOK')).canPerform
    }, 'User restrictions retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/moderation/restrictions');
  }
}