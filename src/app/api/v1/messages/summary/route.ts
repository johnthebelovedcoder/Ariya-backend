import { NextRequest } from 'next/server';
import { MessageService } from '@/lib/message-service';
import { requireAuthApi, createApiResponse, createApiError, handleApiError } from '@/lib/api-utils';

// GET /api/messages/summary - Get message summary for the authenticated user
export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuthApi();
    const { user } = authResult;
    
    const summary = await MessageService.getMessageSummary(user.id);
    
    return createApiResponse(summary, 'Message summary retrieved successfully');
  } catch (error: any) {
    return handleApiError(error, 'GET /api/messages/summary');
  }
}